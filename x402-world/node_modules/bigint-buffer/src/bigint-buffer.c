
#define NAPI_EXPERIMENTAL
#include <node_api.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <limits.h> 

#define BIT_MASK(n) (~( ((~0ull) << ((n)-1)) << 1 ))

// The maximum size we'll store on the stack. If we need a larger temporary
// buffer malloc will be called.
#define BUFFER_STACK_SIZE 32

#if defined(_WIN16) || defined(_WIN32) || defined(_WIN64)
#define bswap64(x) _byteswap_uint64(x)
#else
#define bswap64(x) __builtin_bswap64(x)
#endif

/**
 * Converts a Buffer to bigint.
 * node param 0: buffer
 * node param 1: big_endian (optional boolean)
 * 
 * returns bigint
 */
napi_value toBigInt (napi_env env, napi_callback_info info) {
  napi_value argv[2];
  napi_status status;
  size_t argc = 2;

  status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  assert(status == napi_ok);

  if (argc < 1) {
    napi_throw_error(env, "EINVAL", "Too few arguments");
    return NULL;
  }

  bool big_endian;
  status = napi_get_value_bool(env, argv[1], &big_endian);
  if (status == napi_boolean_expected) { big_endian = false; }

  uint8_t* buffer;
  size_t len;
  status = napi_get_buffer_info(env, argv[0], (void**) &buffer, &len);
  assert(status == napi_ok);

  // If len is not divisible by 8 bytes, we'll need to copy
  bool not_64_aligned = (len & 7) != 0;
  size_t overflow_len = not_64_aligned ? 8 - (len & 0x7) : 0;
  // Buffer is managed by VM, so copy it out (TODO: perhaps we can increase refcount?)
  size_t aligned_len = len + overflow_len;
  size_t len_in_words = not_64_aligned ? (len >> 3) + 1 : (len >> 3);
  bool fits_in_stack = aligned_len <= BUFFER_STACK_SIZE;

  uint8_t copy[BUFFER_STACK_SIZE];
  uint8_t* bufTemp = fits_in_stack ? copy : malloc(aligned_len);
  if (overflow_len > 0) {
    memset(bufTemp + len, 0, overflow_len);
  }
  memcpy(bufTemp, buffer, len);
  uint64_t* as_64_aligned = (uint64_t*) bufTemp;
  size_t overflow_in_bits = overflow_len << 3; // == overflow_len * 8

  napi_value out;
  // swap
  if (big_endian) {
    if (len_in_words == 1) {
        as_64_aligned[0] = not_64_aligned ? bswap64(as_64_aligned[0]) >> overflow_in_bits :  bswap64(as_64_aligned[0]);
    } else {
        uint64_t temp;
        size_t last_word = len_in_words - 1;
        size_t end_ptr = last_word;
        int32_t offset;
        for (offset = 0; offset < (int32_t)(len_in_words / 2); offset++) {
            temp = as_64_aligned[offset];
            as_64_aligned[offset] = as_64_aligned[end_ptr];
            as_64_aligned[end_ptr] = temp;
            end_ptr--;
        } 
        uint64_t prev_overflow = 0;
        for (offset = last_word; offset >= 0; offset--) {
            uint64_t as_little_endian = bswap64(as_64_aligned[offset]);
            uint64_t overflow = as_little_endian & BIT_MASK(overflow_in_bits);
            as_64_aligned[offset] = not_64_aligned ? (as_little_endian >> overflow_in_bits) | prev_overflow : as_little_endian;
            prev_overflow = overflow << (64 - overflow_in_bits);
        }
    }
  }

  status = napi_create_bigint_words(env, 0, len_in_words, as_64_aligned , &out);
  assert(status == napi_ok);

  if (!fits_in_stack) {
      free(bufTemp);
  }

  return out;
}

/**
 * Converts a BigInt to a Buffer
 * node param 0: BigInt
 * node param 1: buffer
 * node param 2: big_endian (optional boolean)
 * 
 * returns bigint
 */
napi_value fromBigInt (napi_env env, napi_callback_info info) {
  napi_value argv[3];
  napi_status status;
  size_t argc = 3;

  status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  assert(status == napi_ok);

  if (argc < 1) {
    napi_throw_error(env, "EINVAL", "Too few arguments");
    return NULL;
  }

  size_t byte_width;
  bool big_endian;
  status = napi_get_value_bool(env, argv[2], &big_endian);
  if (status == napi_boolean_expected) { big_endian = false; }

  size_t word_count;
  status = napi_get_value_bigint_words(env, argv[0], NULL, &word_count, NULL);
  assert(status == napi_ok);

  uint8_t* raw_buffer;
  status = napi_get_buffer_info(env, argv[1], (void**) &raw_buffer, &byte_width);
  assert(status == napi_ok);

  if (word_count == 0) {
      memset(raw_buffer, 0, byte_width);
      return argv[1];
  }

  int sign_bit = 0;
  
  bool not_64_aligned = (byte_width & 7) != 0;
  size_t overflow_len = not_64_aligned ? 8 - (byte_width & 0x7) : 0;
  size_t word_width = (byte_width >> 3) + (not_64_aligned ? 1 : 0);
  size_t original_word_width = word_width;
  if (word_count > word_width) {
      word_count = word_width;
  }
  size_t word_width_bytes = (word_count << 3);
  bool fits_in_stack = word_width_bytes <= BUFFER_STACK_SIZE;

  uint64_t* conv_buffer = (uint64_t*) raw_buffer;
  uint64_t stack_buffer[BUFFER_STACK_SIZE];
  if (not_64_aligned) {
      conv_buffer = fits_in_stack ? stack_buffer : malloc(byte_width + overflow_len);
  }
  
  memset(conv_buffer, 0, byte_width + overflow_len);
  status = napi_get_value_bigint_words(env, argv[0], &sign_bit, &word_count, conv_buffer);
  assert(status == napi_ok);

  if (big_endian) {
        uint64_t temp;
        size_t conv_words = original_word_width;
        size_t last_word = conv_words - 1;
        size_t end_ptr = last_word;
        int32_t offset;
        for (offset = 0; offset < (int32_t)(conv_words / 2); offset++) {
            temp = bswap64(conv_buffer[offset]);
            conv_buffer[offset] = bswap64(conv_buffer[end_ptr]);
            conv_buffer[end_ptr] = temp;
            end_ptr--;
        } 
        if (conv_words & 1) {
            conv_buffer[conv_words / 2] = bswap64(conv_buffer[conv_words / 2]);;
        }
  }
  if (not_64_aligned) {
      memcpy(raw_buffer, big_endian ? (uint64_t*)(((uint8_t*)conv_buffer) + (8-(byte_width & 7))) : conv_buffer, byte_width);
      if (!fits_in_stack) {
          free(conv_buffer);
      }
  }
  return argv[1];
}

napi_value init_all (napi_env env, napi_value exports) {
  napi_value bigint_fn;
  napi_value frombigint_fn;

  napi_create_function(env, NULL, 0, toBigInt, NULL, &bigint_fn);
  napi_create_function(env, NULL, 0, fromBigInt, NULL, &frombigint_fn);

  napi_set_named_property(env, exports, "toBigInt", bigint_fn);
  napi_set_named_property(env, exports, "fromBigInt", frombigint_fn);

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init_all);
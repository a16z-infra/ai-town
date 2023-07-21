export default function InputCard() {
  return (
    <form className="mx-auto mt-16 flex max-w-3xl gap-x-4">
      <label htmlFor="website-link" className="sr-only">
        Link
      </label>
      <input
        autoFocus={true}
        id="website-link"
        name="link"
        type="url"
        autoComplete="url"
        required
        className="min-w-0 flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6"
        placeholder="Enter a link to a blog"
      />
      <button
        type="submit"
        className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Chat
      </button>
    </form>
  );
}

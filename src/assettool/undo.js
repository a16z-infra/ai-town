
const UNDO_STAX_MAX_LEN = 16

let undo_stack = [];
let undoqueu   = [];

export function undo_mark_task_start(level_container, sprites) {
    undoqueu = [];
    undoqueu.push(level_container);
    undoqueu.push(sprites);
}

export function undo_add_index_to_task(tileindex) {
    undoqueu.push(tileindex);
}

export function undo_mark_task_end() {
    undo_stack.push(undoqueu);
    if (undo_stack.length > UNDO_STAX_MAX_LEN){
        undo_stack.shift();
    }
}

// utility function for adding a single tile as a task
export function undo_add_single_index_as_task(level_container, sprites, tileindex) {
    undo_mark_task_start(level_container, sprites);
    undo_add_index_to_task(tileindex);
    undo_mark_task_end();
}

export function undo_pop() {
    return undo_stack.pop();
}
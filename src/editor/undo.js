const UNDO_STAX_MAX_LEN = 16

let undo_stack = [];
let undoqueu   = [];

export function undo_mark_task_start(layer) {
    undoqueu = [];
    undoqueu.push(layer);
}

export function undo_add_index_to_task(tileindex, oldValue) {
    undoqueu.push([tileindex, oldValue]);
}

export function undo_mark_task_end() {
    undo_stack.push(undoqueu);
    if (undo_stack.length > UNDO_STAX_MAX_LEN){
        undo_stack.shift();
    }
}

// utility function for adding a single tile as a task
export function undo_add_single_index_as_task(layer, tileindex, oldValue) {
    undo_mark_task_start(layer);
    undo_add_index_to_task(tileindex, oldValue);
    undo_mark_task_end();
}

export function undo_pop() {
    return undo_stack.pop();
}

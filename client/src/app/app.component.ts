import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService, Task } from './services/tasks.service';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TaskCardComponent } from './components/task-card/task-card.component';
import { EditModalComponent } from './components/edit-modal/edit-modal.component';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatSelectModule, MatOptionModule, 
    MatSnackBarModule, TaskCardComponent, EditModalComponent, DragDropModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private isSelecting = false;
  
  tasks = signal<Task[]>([]);
  todoTasks = signal<Task[]>([]);
  doneTasks = signal<Task[]>([]);
  isLoading = signal<boolean>(true);

  title = '';
  description = '';
  priority = 'low';

  editMode = false;
  editTaskId: number | null = null;
  editTitle = '';
  editDescription = '';
  editPriority = 'low';

  constructor(private tasksService: TasksService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadTasks();

    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      this.isSelecting = !!selection && selection.toString().length > 0;
    });
  }

  showToast(message: string, isError = false) { 
    this.snackBar.open(message, 'OK', { 
      duration: 3000, 
      horizontalPosition: 'right', 
      verticalPosition: 'top',
      panelClass: isError ? ['error-toast'] : []
    }); 
  }

  loadTasks() {
    this.isLoading.set(true);
    this.tasksService.getTasks().subscribe({
      next: (data) => {
        this.tasks.set(data);
        this.todoTasks.set(data.filter(t => t.status === 'todo'));
        this.doneTasks.set(data.filter(t => t.status === 'done'));
        this.isLoading.set(false);
      },
      error: () => {
        this.showToast('Failed to load tasks', true);
        this.isLoading.set(false);
      }
    });
  }

  createTask() {
    if (!this.title.trim()) {
      this.showToast('Title is required', true);
      return;
    }

    this.tasksService.createTask({
      title: this.title,
      description: this.description,
      status: 'todo',
      priority: this.priority
    }).subscribe({
      next: () => {
        this.title = '';
        this.description = '';
        this.priority = 'low';
        this.loadTasks();
        this.showToast('Task created successfully');
      },
      error: () => this.showToast('Failed to create task', true)
    });
  }

  deleteTask(id: number) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    this.tasksService.deleteTask(id).subscribe({
      next: () => {
        this.loadTasks();
        this.showToast('Task deleted');
      },
      error: () => this.showToast('Failed to delete task', true)
    });
  }

  toggleStatus(task: Task) {
    const isCurrentlyTodo = this.todoTasks().includes(task);
    let todoList = [...this.todoTasks()];
    let doneList = [...this.doneTasks()];

    if (isCurrentlyTodo) {
      todoList = todoList.filter(t => t.id !== task.id);
      doneList.unshift({ ...task, status: 'done' });
    } else {
      doneList = doneList.filter(t => t.id !== task.id);
      todoList.unshift({ ...task, status: 'todo' });
    }

    this.todoTasks.set(todoList);
    this.doneTasks.set(doneList);

    const targetList = isCurrentlyTodo ? doneList : todoList;
    const payload = targetList.map((t, index) => ({
      id: t.id,
      order: index, 
      status: t.status
    }));

    this.tasksService.updateTaskOrders(payload).subscribe({
      error: () => {
        this.showToast('Error updating task status', true);
        this.loadTasks();
      }
    });
  }

  startEdit(task: Task) {
    this.editMode = true;
    this.editTaskId = task.id;
    this.editTitle = task.title;
    this.editDescription = task.description;
    this.editPriority = task.priority || 'low';
  }

  saveEdit(updatedData: { title: string, description: string, priority: string }) {
    if (!this.editTaskId) return;

    this.tasksService.updateTask(this.editTaskId, updatedData).subscribe({
      next: () => {
        this.loadTasks();
        this.closeEdit();
        this.showToast('Task updated successfully');
      },
      error: () => this.showToast('Failed to update task', true)
    });
  }

  closeEdit() {
    this.editMode = false;
    this.editTaskId = null;
    this.editTitle = '';
    this.editDescription = '';
    this.editPriority = 'low';
  }

  onBackdropPointerDown(event: PointerEvent) {
    if (event.target !== event.currentTarget) return;
    if (this.isSelecting) return;
    this.closeEdit();
  }

  trackById(index: number, item: Task) {
    return item.id;
  }

  onDrop(event: CdkDragDrop<Task[]>, newStatus: string) {
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }

    const todoList = [...this.todoTasks()];
    const doneList = [...this.doneTasks()];

    if (event.previousContainer === event.container) {
      const list = newStatus === 'todo' ? todoList : doneList;
      moveItemInArray(list, event.previousIndex, event.currentIndex);
    } else {
      if (newStatus === 'todo') {
        transferArrayItem(doneList, todoList, event.previousIndex, event.currentIndex);
        todoList[event.currentIndex] = { ...todoList[event.currentIndex], status: 'todo' };
      } else {
        transferArrayItem(todoList, doneList, event.previousIndex, event.currentIndex);
        doneList[event.currentIndex] = { ...doneList[event.currentIndex], status: 'done' };
      }
    }

    this.todoTasks.set(todoList);
    this.doneTasks.set(doneList);

    const targetList = newStatus === 'todo' ? todoList : doneList;
    const payload = targetList.map((task, index) => ({
      id: task.id, 
      order: index,
      status: task.status
    }));

    this.tasksService.updateTaskOrders(payload).subscribe({
      error: () => {
        this.showToast('Error saving new order', true);
        this.loadTasks(); 
      }
    });
  }
}
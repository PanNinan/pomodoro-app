import { defineStore } from 'pinia'
import { ref, computed, readonly, toRaw } from 'vue'
import type { Task, TaskStatus } from '@/types'
import { storage } from '@/storage'
import { generateId } from '@/utils/uuid'
import { nowISO } from '@/utils/date'

const TABLE = 'tasks'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const currentTaskId = ref<string | null>(null)
  const loading = ref(false)

  // 计算属性
  const activeTask = computed(() =>
    tasks.value.find((t) => t.id === currentTaskId.value) ?? null
  )

  const todoTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'todo').sort((a, b) => a.order - b.order)
  )

  const doingTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'doing').sort((a, b) => a.order - b.order)
  )

  const doneTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'done').sort((a, b) => a.order - b.order)
  )

  const taskStats = computed(() => ({
    todo: todoTasks.value.length,
    doing: doingTasks.value.length,
    done: doneTasks.value.length,
  }))

  // 从数据库加载任务
  async function loadTasks(): Promise<void> {
    loading.value = true
    try {
      const data = await storage.getAllSorted<Task>(TABLE, 'order')
      if (data.length > 0) {
        tasks.value = data
      }
    } catch (e) {
      console.error('[TaskStore] loadTasks 失败:', e)
    } finally {
      loading.value = false
    }
  }

  // 添加任务
  async function addTask(
    data: Pick<Task, 'title' | 'description' | 'pomodoroEstimate' | 'priority' | 'tags'>
  ): Promise<Task> {
    const task: Task = {
      id: generateId(),
      title: data.title,
      description: data.description,
      pomodoroEstimate: data.pomodoroEstimate,
      pomodoroActual: 0,
      status: 'todo',
      priority: data.priority,
      tags: [...(data.tags ?? [])],
      createdAt: nowISO(),
      order: tasks.value.length,
    }
    // 先写入内存
    tasks.value.push(task)
    // 再持久化
    try {
      await storage.insert(TABLE, toRaw(task))
    } catch (e) {
      console.error('[TaskStore] addTask 持久化失败:', e)
    }
    return task
  }

  // 更新任务
  async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await storage.updateById(TABLE, id, toRaw(updates) as Record<string, unknown>)
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      tasks.value[idx] = { ...tasks.value[idx], ...updates }
    }
  }

  // 删除任务
  async function deleteTask(id: string): Promise<void> {
    await storage.deleteById(TABLE, id)
    tasks.value = tasks.value.filter((t) => t.id !== id)
    if (currentTaskId.value === id) {
      currentTaskId.value = null
    }
  }

  // 设置当前任务
  function setCurrentTask(id: string | null): void {
    currentTaskId.value = id
  }

  // 完成一个番茄后，给任务的 pomodoroActual +1，达到预估数自动完成
  async function incrementPomodoro(taskId: string): Promise<void> {
    const task = tasks.value.find((t) => t.id === taskId)
    if (task) {
      const newActual = task.pomodoroActual + 1
      if (newActual >= task.pomodoroEstimate) {
        await updateTask(taskId, {
          pomodoroActual: newActual,
          status: 'done',
          completedAt: nowISO(),
        })
        currentTaskId.value = null
      } else {
        await updateTask(taskId, { pomodoroActual: newActual })
      }
    }
  }

  // 标记任务完成
  async function completeTask(id: string): Promise<void> {
    await updateTask(id, { status: 'done', completedAt: nowISO() })
  }

  // 改变任务状态
  async function changeStatus(id: string, status: TaskStatus): Promise<void> {
    const updates: Partial<Task> = { status }
    if (status === 'done') {
      updates.completedAt = nowISO()
    }
    await updateTask(id, updates)
  }

  // 按状态获取
  function getTasksByStatus(status: TaskStatus): Task[] {
    return tasks.value.filter((t) => t.status === status)
  }

  // 按标签获取
  function getTasksByTag(tag: string): Task[] {
    return tasks.value.filter((t) => t.tags.includes(tag))
  }

  return {
    tasks: readonly(tasks),
    currentTaskId,
    loading: readonly(loading),
    activeTask,
    todoTasks,
    doingTasks,
    doneTasks,
    taskStats,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    setCurrentTask,
    incrementPomodoro,
    completeTask,
    changeStatus,
    getTasksByStatus,
    getTasksByTag,
  }
})

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { useTimer } from '@/composables/useTimer'
import TaskItem from '@/components/tasks/TaskItem.vue'
import TaskForm from '@/components/tasks/TaskForm.vue'
import type { Task, TaskStatus } from '@/types'
import { isToday, isThisWeek, parseISO } from 'date-fns'

const taskStore = useTaskStore()
const { setCurrentTask: setTimerTask } = useTimer()
const showForm = ref(false)

// ─── Tab 切换 ───
const activeTab = ref<'doing' | 'todo' | 'done'>('doing')

// ─── 搜索 ───
const searchQuery = ref('')

// ─── 通用操作 ───
function handleDelete(id: string) {
  taskStore.deleteTask(id)
}

function handleStatusChange(id: string, status: TaskStatus) {
  taskStore.changeStatus(id, status)
}

function handleSelect(id: string) {
  const next = taskStore.currentTaskId === id ? null : id
  taskStore.setCurrentTask(next)
  setTimerTask(next)
}

// ─── 搜索过滤 ───
function matchesSearch(task: Task): boolean {
  if (!searchQuery.value) return true
  const q = searchQuery.value.toLowerCase()
  return (
    task.title.toLowerCase().includes(q) ||
    task.description?.toLowerCase().includes(q) ||
    task.tags.some((t) => t.toLowerCase().includes(q))
  )
}

const filteredDoing = computed(() => taskStore.doingTasks.filter(matchesSearch))
const filteredTodo = computed(() => taskStore.todoTasks.filter(matchesSearch))
const filteredDone = computed(() => taskStore.doneTasks.filter(matchesSearch))

// ─── 已完成分组 ───
const GROUP_SIZE = 10

const doneGroups = computed(() => {
  const today: Task[] = []
  const thisWeek: Task[] = []
  const earlier: Task[] = []

  for (const task of filteredDone.value) {
    const date = task.completedAt ? parseISO(task.completedAt) : parseISO(task.createdAt)
    if (isToday(date)) today.push(task)
    else if (isThisWeek(date, { weekStartsOn: 1 })) thisWeek.push(task)
    else earlier.push(task)
  }

  return [
    { key: 'today', label: '今天', tasks: today, defaultOpen: true },
    { key: 'week', label: '本周', tasks: thisWeek, defaultOpen: false },
    { key: 'earlier', label: '更早', tasks: earlier, defaultOpen: false },
  ].filter((g) => g.tasks.length > 0)
})

const groupExpanded = ref<Record<string, boolean>>({})
function isGroupOpen(key: string, def: boolean) { return groupExpanded.value[key] ?? def }
function toggleGroup(key: string, def: boolean) { groupExpanded.value[key] = !isGroupOpen(key, def) }

const groupShowAll = ref<Record<string, boolean>>({})
function visibleTasks(key: string, tasks: Task[]) {
  return groupShowAll.value[key] ? tasks : tasks.slice(0, GROUP_SIZE)
}

onMounted(() => { taskStore.loadTasks() })
</script>

<template>
  <div class="task-view">
    <!-- 头部：标题 + 新建 -->
    <div class="task-view__header">
      <h1>任务管理</h1>
      <n-button type="primary" size="small" @click="showForm = true">+ 新建</n-button>
    </div>

    <!-- 搜索栏 -->
    <n-input
      v-model:value="searchQuery"
      placeholder="搜索任务名称、描述或标签..."
      clearable
      size="small"
      class="task-view__search"
    />

    <!-- Tab 切换 + badge -->
    <n-tabs v-model:value="activeTab" type="segment" animated size="small" class="task-view__tabs">
      <n-tab-pane name="doing">
        <template #tab>
          <span>进行中 <n-badge :value="taskStore.taskStats.doing" :max="99" /></span>
        </template>
      </n-tab-pane>
      <n-tab-pane name="todo">
        <template #tab>
          <span>待办 <n-badge :value="taskStore.taskStats.todo" :max="99" /></span>
        </template>
      </n-tab-pane>
      <n-tab-pane name="done">
        <template #tab>
          <span>已完成 <n-badge :value="taskStore.taskStats.done" :max="999" /></span>
        </template>
      </n-tab-pane>
    </n-tabs>

    <!-- 进行中 -->
    <div v-show="activeTab === 'doing'" class="task-view__list">
      <TaskItem
        v-for="task in filteredDoing"
        :key="task.id"
        :task="task"
        mode="doing"
        compact
        @delete="handleDelete"
        @status-change="handleStatusChange"
        @select="handleSelect"
      />
      <n-empty v-if="!filteredDoing.length" :description="searchQuery ? '无匹配任务' : '暂无进行中的任务'" />
    </div>

    <!-- 待办 -->
    <div v-show="activeTab === 'todo'" class="task-view__list">
      <TaskItem
        v-for="task in filteredTodo"
        :key="task.id"
        :task="task"
        mode="todo"
        compact
        @delete="handleDelete"
        @status-change="handleStatusChange"
      />
      <n-empty v-if="!filteredTodo.length" :description="searchQuery ? '无匹配任务' : '暂无待办任务'" />
    </div>

    <!-- 已完成（时间分组） -->
    <div v-show="activeTab === 'done'">
      <div v-for="group in doneGroups" :key="group.key" class="task-view__group">
        <div class="task-view__group-header" @click="toggleGroup(group.key, group.defaultOpen)">
          <span>{{ group.label }}（{{ group.tasks.length }}）</span>
          <span class="task-view__toggle">{{ isGroupOpen(group.key, group.defaultOpen) ? '▾' : '▸' }}</span>
        </div>
        <div v-if="isGroupOpen(group.key, group.defaultOpen)" class="task-view__list">
          <TaskItem
            v-for="task in visibleTasks(group.key, group.tasks)"
            :key="task.id"
            :task="task"
            mode="done"
            compact
            @delete="handleDelete"
          />
          <n-button
            v-if="!groupShowAll[group.key] && group.tasks.length > GROUP_SIZE"
            quaternary size="small"
            @click="groupShowAll[group.key] = true"
          >
            查看更多（还有 {{ group.tasks.length - GROUP_SIZE }} 个）
          </n-button>
        </div>
      </div>
      <n-empty v-if="!doneGroups.length" :description="searchQuery ? '无匹配任务' : '暂无已完成任务'" />
    </div>

    <!-- 新建任务弹窗 -->
    <TaskForm v-model:show="showForm" />
  </div>
</template>

<style scoped>
.task-view {
  max-width: 700px;
  margin: 0 auto;
}

.task-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.task-view__header h1 {
  margin: 0;
  font-size: 24px;
}

.task-view__search {
  margin-bottom: 12px;
}

.task-view__tabs {
  margin-bottom: 16px;
}

.task-view__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 分组 */
.task-view__group {
  margin-bottom: 8px;
}

.task-view__group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: var(--n-text-color-3);
  border-bottom: 1px solid var(--n-border-color);
  position: sticky;
  top: 0;
  background: var(--n-color);
  z-index: 1;
}

.task-view__toggle {
  font-size: 13px;
  color: var(--n-text-color-3);
}
</style>

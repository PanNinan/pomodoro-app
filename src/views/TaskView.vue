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

// ─── 已完成任务分组 ───
const doneExpanded = ref(false)

const GROUP_SIZE = 10

const doneGroups = computed(() => {
  const today: Task[] = []
  const thisWeek: Task[] = []
  const earlier: Task[] = []

  for (const task of taskStore.doneTasks) {
    const date = task.completedAt ? parseISO(task.completedAt) : parseISO(task.createdAt)
    if (isToday(date)) {
      today.push(task)
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
      thisWeek.push(task)
    } else {
      earlier.push(task)
    }
  }

  return [
    { key: 'today', label: '今天', tasks: today, defaultOpen: true },
    { key: 'week', label: '本周', tasks: thisWeek, defaultOpen: false },
    { key: 'earlier', label: '更早', tasks: earlier, defaultOpen: false },
  ].filter((g) => g.tasks.length > 0)
})

// 每组展开状态
const groupExpanded = ref<Record<string, boolean>>({})

function isGroupOpen(key: string, defaultOpen: boolean): boolean {
  return groupExpanded.value[key] ?? defaultOpen
}

function toggleGroup(key: string, defaultOpen: boolean): void {
  groupExpanded.value[key] = !isGroupOpen(key, defaultOpen)
}

// 每组显示更多
const groupShowAll = ref<Record<string, boolean>>({})

function visibleTasks(key: string, tasks: Task[]): Task[] {
  return groupShowAll.value[key] ? tasks : tasks.slice(0, GROUP_SIZE)
}

onMounted(() => {
  taskStore.loadTasks()
})
</script>

<template>
  <div class="task-view">
    <div class="task-view__header">
      <h1>任务管理</h1>
      <n-button type="primary" @click="showForm = true">
        + 新建任务
      </n-button>
    </div>

    <!-- 统计卡片 -->
    <div class="task-view__stats">
      <n-card size="small">
        <n-statistic label="待办" :value="taskStore.taskStats.todo" />
      </n-card>
      <n-card size="small">
        <n-statistic label="进行中" :value="taskStore.taskStats.doing" />
      </n-card>
      <n-card size="small">
        <n-statistic label="已完成" :value="taskStore.taskStats.done" />
      </n-card>
    </div>

    <!-- 进行中 -->
    <div class="task-view__section">
      <h3>进行中</h3>
      <div v-if="taskStore.doingTasks.length" class="task-view__list">
        <TaskItem
          v-for="task in taskStore.doingTasks"
          :key="task.id"
          :task="task"
          mode="doing"
          @delete="handleDelete"
          @status-change="handleStatusChange"
          @select="handleSelect"
        />
      </div>
      <n-empty v-else description="暂无进行中的任务" />
    </div>

    <!-- 待办 -->
    <div class="task-view__section">
      <h3>待办</h3>
      <div v-if="taskStore.todoTasks.length" class="task-view__list">
        <TaskItem
          v-for="task in taskStore.todoTasks"
          :key="task.id"
          :task="task"
          mode="todo"
          @delete="handleDelete"
          @status-change="handleStatusChange"
        />
      </div>
      <n-empty v-else description="暂无待办任务" />
    </div>

    <!-- 已完成（折叠 + 时间分组） -->
    <div v-if="taskStore.doneTasks.length" class="task-view__section">
      <div class="task-view__done-header" @click="doneExpanded = !doneExpanded">
        <h3>
          已完成
          <n-badge :value="taskStore.taskStats.done" :max="999" />
        </h3>
        <span class="task-view__toggle">{{ doneExpanded ? '收起' : '展开' }}</span>
      </div>

      <template v-if="doneExpanded">
        <div v-for="group in doneGroups" :key="group.key" class="task-view__group">
          <div
            class="task-view__group-header"
            @click="toggleGroup(group.key, group.defaultOpen)"
          >
            <span>{{ group.label }}（{{ group.tasks.length }}）</span>
            <span class="task-view__toggle">
              {{ isGroupOpen(group.key, group.defaultOpen) ? '▾' : '▸' }}
            </span>
          </div>

          <div v-if="isGroupOpen(group.key, group.defaultOpen)" class="task-view__list">
            <TaskItem
              v-for="task in visibleTasks(group.key, group.tasks)"
              :key="task.id"
              :task="task"
              mode="done"
              @delete="handleDelete"
            />
            <n-button
              v-if="!groupShowAll[group.key] && group.tasks.length > GROUP_SIZE"
              quaternary
              size="small"
              @click="groupShowAll[group.key] = true"
            >
              查看更多（还有 {{ group.tasks.length - GROUP_SIZE }} 个）
            </n-button>
          </div>
        </div>
      </template>
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
  margin-bottom: 24px;
}

.task-view__header h1 {
  margin: 0;
  font-size: 24px;
}

.task-view__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}

.task-view__section {
  margin-bottom: 32px;
}

.task-view__section h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--n-text-color-2);
}

.task-view__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 已完成区域头部 */
.task-view__done-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  margin-bottom: 12px;
}

.task-view__done-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 分组头部 */
.task-view__group {
  margin-bottom: 16px;
}

.task-view__group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: var(--n-text-color-3);
  border-bottom: 1px solid var(--n-border-color);
  margin-bottom: 12px;
}

.task-view__toggle {
  font-size: 13px;
  color: var(--n-text-color-3);
  cursor: pointer;
}
</style>

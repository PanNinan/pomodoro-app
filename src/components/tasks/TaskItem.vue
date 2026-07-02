<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTaskStore } from '@/stores/task'
import type { Task, TaskStatus, TaskPriority } from '@/types'

const props = defineProps<{
  task: Task
  mode: 'doing' | 'todo' | 'done'
}>()

const emit = defineEmits<{
  statusChange: [id: string, status: TaskStatus]
  delete: [id: string]
  select: [id: string]
}>()

const taskStore = useTaskStore()

const priorityColors: Record<TaskPriority, string> = {
  low: '#52c41a',
  medium: '#faad14',
  high: '#ff4d4f',
}

const priorityLabel: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const isCurrent = computed(() => taskStore.currentTaskId === props.task.id)

// ─── 编辑状态 ───
const showEdit = ref(false)
const editForm = ref({
  title: '',
  description: '',
  pomodoroEstimate: 4,
  priority: 'medium' as TaskPriority,
  tags: [] as string[],
  tagInput: '',
})

const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
]

function openEdit() {
  editForm.value = {
    title: props.task.title,
    description: props.task.description ?? '',
    pomodoroEstimate: props.task.pomodoroEstimate,
    priority: props.task.priority,
    tags: [...props.task.tags],
    tagInput: '',
  }
  showEdit.value = true
}

function addEditTag() {
  const tag = editForm.value.tagInput.trim()
  if (tag && !editForm.value.tags.includes(tag)) {
    editForm.value.tags.push(tag)
  }
  editForm.value.tagInput = ''
}

function removeEditTag(index: number) {
  editForm.value.tags.splice(index, 1)
}

async function saveEdit() {
  if (!editForm.value.title.trim()) return
  await taskStore.updateTask(props.task.id, {
    title: editForm.value.title.trim(),
    description: editForm.value.description || undefined,
    pomodoroEstimate: editForm.value.pomodoroEstimate,
    priority: editForm.value.priority,
    tags: [...editForm.value.tags],
  })
  showEdit.value = false
}
</script>

<template>
  <div
    class="task-card"
    :class="{
      'task-card--current': isCurrent && mode === 'doing',
      'task-card--done': mode === 'done',
    }"
  >
    <div class="task-card__header">
      <template v-if="mode !== 'done'">
        <n-tag :border-color="priorityColors[task.priority]" size="small">
          {{ priorityLabel[task.priority] }}
        </n-tag>
        <span class="task-card__title">{{ task.title }}</span>
        <n-tag v-if="isCurrent" type="success" size="small">当前</n-tag>
      </template>
      <template v-else>
        <span class="task-card__title">✅ {{ task.title }}</span>
      </template>
    </div>

    <div v-if="task.description && mode !== 'done'" class="task-card__desc">
      {{ task.description }}
    </div>

    <div class="task-card__footer">
      <span class="task-card__progress">
        <template v-if="mode === 'todo'">🍅 预估 {{ task.pomodoroEstimate }} 个番茄</template>
        <template v-else>🍅 {{ task.pomodoroActual }}/{{ task.pomodoroEstimate }}</template>
      </span>

      <!-- 标签 — 所有模式都显示 -->
      <div v-if="task.tags.length" class="task-card__tags">
        <n-tag v-for="tag in task.tags" :key="tag" size="small" :bordered="false">
          {{ tag }}
        </n-tag>
      </div>

      <div class="task-card__actions">
        <!-- doing 模式操作 -->
        <template v-if="mode === 'doing'">
          <n-button size="tiny" quaternary @click="emit('select', task.id)">
            {{ isCurrent ? '取消选择' : '选择' }}
          </n-button>
          <n-button size="tiny" quaternary type="success" @click="emit('statusChange', task.id, 'done')">
            完成
          </n-button>
          <n-button size="tiny" quaternary @click="emit('statusChange', task.id, 'todo')">
            移回待办
          </n-button>
        </template>

        <!-- todo 模式操作 -->
        <template v-if="mode === 'todo'">
          <n-button size="tiny" quaternary type="info" @click="emit('statusChange', task.id, 'doing')">
            开始
          </n-button>
          <n-button size="tiny" quaternary @click="openEdit">
            编辑
          </n-button>
        </template>

        <!-- 通用：删除 -->
        <n-popconfirm @positive-click="emit('delete', task.id)">
          <template #trigger>
            <n-button size="tiny" quaternary type="error">删除</n-button>
          </template>
          确认删除该任务？
        </n-popconfirm>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <n-modal v-model:show="showEdit" preset="card" title="编辑任务" style="width: 480px">
      <n-form label-placement="left" label-width="80">
        <n-form-item label="任务名称" required>
          <n-input v-model:value="editForm.title" placeholder="输入任务名称" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="editForm.description" type="textarea" placeholder="任务描述（可选）" :rows="2" />
        </n-form-item>
        <n-form-item label="预估番茄">
          <n-input-number v-model:value="editForm.pomodoroEstimate" :min="1" :max="50" />
        </n-form-item>
        <n-form-item label="优先级">
          <n-select v-model:value="editForm.priority" :options="priorityOptions" />
        </n-form-item>
        <n-form-item label="标签">
          <div style="width: 100%">
            <div style="margin-bottom: 8px;">
              <n-tag
                v-for="(tag, i) in editForm.tags"
                :key="tag"
                closable
                size="small"
                @close="removeEditTag(i)"
                style="margin-right: 4px;"
              >
                {{ tag }}
              </n-tag>
            </div>
            <n-input
              v-model:value="editForm.tagInput"
              size="small"
              placeholder="输入标签后回车"
              @keyup.enter="addEditTag"
            />
          </div>
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showEdit = false">取消</n-button>
        <n-button type="primary" :disabled="!editForm.title.trim()" @click="saveEdit">保存</n-button>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.task-card {
  padding: 16px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  transition: border-color 0.2s;
}

.task-card--current {
  border-color: var(--n-primary-color);
  background-color: rgba(32, 128, 240, 0.04);
}

.task-card--done {
  opacity: 0.6;
}

.task-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.task-card__title {
  font-size: 15px;
  font-weight: 500;
}

.task-card__desc {
  font-size: 13px;
  color: var(--n-text-color-3);
  margin-bottom: 8px;
}

.task-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.task-card__progress {
  font-size: 13px;
  color: var(--n-text-color-3);
}

.task-card__tags {
  display: flex;
  gap: 4px;
}

.task-card__actions {
  display: flex;
  gap: 4px;
}
</style>

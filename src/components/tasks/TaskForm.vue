<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTaskStore } from '@/stores/task'
import type { TaskPriority } from '@/types'

const show = defineModel<boolean>('show', { default: false })

const taskStore = useTaskStore()

const form = ref({
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

const canSubmit = computed(() => form.value.title.trim().length > 0)

function resetForm() {
  form.value = {
    title: '',
    description: '',
    pomodoroEstimate: 4,
    priority: 'medium',
    tags: [],
    tagInput: '',
  }
}

function addTag() {
  const tag = form.value.tagInput.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  form.value.tagInput = ''
}

function removeTag(index: number) {
  form.value.tags.splice(index, 1)
}

async function submitForm() {
  if (!canSubmit.value) return
  await taskStore.addTask({
    title: form.value.title.trim(),
    description: form.value.description || undefined,
    pomodoroEstimate: form.value.pomodoroEstimate,
    priority: form.value.priority,
    tags: [...form.value.tags],
  })
  show.value = false
  resetForm()
}

// 打开时重置表单
watch(show, (val) => {
  if (val) resetForm()
})
</script>

<template>
  <n-modal v-model:show="show" preset="card" title="新建任务" style="width: 480px">
    <n-form label-placement="left" label-width="80">
      <n-form-item label="任务名称" required>
        <n-input v-model:value="form.title" placeholder="输入任务名称" />
      </n-form-item>
      <n-form-item label="描述">
        <n-input v-model:value="form.description" type="textarea" placeholder="任务描述（可选）" :rows="2" />
      </n-form-item>
      <n-form-item label="预估番茄">
        <n-input-number v-model:value="form.pomodoroEstimate" :min="1" :max="50" />
      </n-form-item>
      <n-form-item label="优先级">
        <n-select v-model:value="form.priority" :options="priorityOptions" />
      </n-form-item>
      <n-form-item label="标签">
        <div style="width: 100%">
          <div style="margin-bottom: 8px;">
            <n-tag
              v-for="(tag, i) in form.tags"
              :key="tag"
              closable
              size="small"
              style="margin-right: 4px;"
              @close="removeTag(i)"
            >
              {{ tag }}
            </n-tag>
          </div>
          <n-input
            v-model:value="form.tagInput"
            size="small"
            placeholder="输入标签后回车"
            @keyup.enter="addTag"
          />
        </div>
      </n-form-item>
    </n-form>
    <template #action>
      <n-button @click="show = false">取消</n-button>
      <n-button type="primary" :disabled="!canSubmit" @click="submitForm">创建</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, shallowRef, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import {
  createApiPermission,
  updateApiPermission,
  type ApiPermission,
} from "@/api/system";
import { message } from "@/utils/message";

const props = defineProps<{
  permission: ApiPermission | null;
}>();

const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{
  saved: [];
}>();

const STANDARD_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

type CatalogDraft = {
  id: number;
  name: string;
  code: string;
  module: string;
  method: string;
  path: string;
  description: string;
  sort: number;
  status: number;
};

const formRef = shallowRef<FormInstance>();
const pending = shallowRef(false);
const formError = shallowRef("");
const form = reactive<CatalogDraft>(createEmptyDraft());

const title = computed(() => (form.id ? "编辑接口定义" : "新增接口定义"));
const methodOptions = computed(() => {
  const current = props.permission?.method?.trim().toUpperCase();
  if (current && !STANDARD_METHODS.includes(current as (typeof STANDARD_METHODS)[number])) {
    return [...STANDARD_METHODS, current];
  }
  return STANDARD_METHODS;
});

const rules: FormRules<CatalogDraft> = {
  name: [{ required: true, message: "请输入接口名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入权限编码", trigger: "blur" }],
  module: [{ required: true, message: "请输入所属模块", trigger: "blur" }],
  method: [{ required: true, message: "请选择请求方法", trigger: "change" }],
  path: [{ required: true, message: "请输入接口路径", trigger: "blur" }],
};

function createEmptyDraft(): CatalogDraft {
  return {
    id: 0,
    name: "",
    code: "",
    module: "",
    method: "GET",
    path: "",
    description: "",
    sort: 0,
    status: 1,
  };
}

function resetForm(permission: ApiPermission | null) {
  Object.assign(form, {
    id: permission?.id ?? 0,
    name: permission?.name ?? "",
    code: permission?.code ?? "",
    module: permission?.module ?? "",
    method: permission?.method ?? "GET",
    path: permission?.path ?? "",
    description: permission?.description ?? "",
    sort: permission?.sort ?? 0,
    status: permission?.status ?? 1,
  });
  formError.value = "";
  void nextTick(() => formRef.value?.clearValidate());
}

function normalizeForm() {
  form.name = form.name.trim();
  form.code = form.code.trim();
  form.module = form.module.trim();
  form.method = form.method.trim().toUpperCase();
  form.path = form.path.trim();
}

function errorMessage(cause: unknown, fallback: string) {
  if (cause && typeof cause === "object") {
    if ("message" in cause && typeof cause.message === "string" && cause.message) {
      return cause.message;
    }
    if (
      "response" in cause && cause.response && typeof cause.response === "object" &&
      "data" in cause.response && cause.response.data && typeof cause.response.data === "object" &&
      "message" in cause.response.data && typeof cause.response.data.message === "string"
    ) {
      return cause.response.data.message;
    }
  }
  return fallback;
}

async function save() {
  if (pending.value) return;
  normalizeForm();
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid || pending.value) return;

  pending.value = true;
  formError.value = "";
  const payload = {
    code: form.code,
    name: form.name,
    module: form.module,
    method: form.method,
    path: form.path,
    description: form.description,
    sort: form.sort,
    status: form.status,
  };

  try {
    const result = form.id
      ? await updateApiPermission({ id: form.id, ...payload })
      : await createApiPermission(payload);
    if (result.code !== 0) throw new Error(result.message || "接口目录保存失败");
    visible.value = false;
    message("接口目录保存成功", { type: "success" });
    emit("saved");
  } catch (cause) {
    formError.value = errorMessage(cause, "接口目录保存失败，请检查填写内容后重试");
  } finally {
    pending.value = false;
  }
}

watch(
  [visible, () => props.permission?.id],
  ([isOpen]) => {
    if (isOpen) resetForm(props.permission);
  },
  { immediate: true },
);
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="min(640px, 95vw)"
    :close-on-click-modal="!pending"
    :close-on-press-escape="!pending"
    :show-close="!pending"
    class="catalog-dialog"
  >
    <el-alert
      title="接口方法和路径用于匹配实际请求。已分配给角色的接口不能修改方法或路径；未分配的接口可以调整，具体限制由服务端校验。"
      type="info"
      show-icon
      :closable="false"
      class="catalog-dialog__notice"
    />
    <el-alert
      v-if="formError"
      :title="formError"
      type="error"
      show-icon
      :closable="false"
      class="catalog-dialog__error"
    />

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      :disabled="pending"
      class="catalog-dialog__form"
      @submit.prevent="save"
    >
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="接口名称" prop="name">
            <el-input v-model="form.name" maxlength="128" clearable placeholder="请输入接口名称" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="权限编码" prop="code">
            <el-input v-model="form.code" maxlength="128" clearable placeholder="请输入权限编码" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="所属模块" prop="module">
            <el-input v-model="form.module" maxlength="64" clearable placeholder="请输入所属模块" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="请求方法" prop="method">
            <el-select v-model="form.method" class="catalog-dialog__field" placeholder="请选择请求方法">
              <el-option v-for="method in methodOptions" :key="method" :label="method" :value="method" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="接口路径" prop="path">
            <el-input v-model="form.path" maxlength="255" clearable placeholder="例如 /users/:id" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              maxlength="255"
              show-word-limit
              placeholder="补充接口用途或授权说明"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="form.sort" :precision="0" class="catalog-dialog__field" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="状态" prop="status">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button :disabled="pending" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="pending" @click="save">保存接口定义</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.catalog-dialog__notice,
.catalog-dialog__error {
  margin-bottom: 16px;
}

.catalog-dialog__form {
  padding-top: 4px;
}

.catalog-dialog__field {
  width: 100%;
}
</style>

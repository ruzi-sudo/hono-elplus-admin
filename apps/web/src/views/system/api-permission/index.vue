<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef } from "vue";
import { useUserStoreHook } from "@/store/modules/user";
import { message } from "@/utils/message";
import {
  createApiPermission,
  getRoleApiPermissionIds,
  listApiPermissionRoles,
  listApiPermissions,
  saveRoleApiPermissions,
  updateApiPermission,
  type ApiPermission,
  type ApiPermissionRole,
} from "@/api/system";

defineOptions({ name: "SystemApiPermission" });

const user = useUserStoreHook();
const canEditCatalog = computed(() => user.roles.includes("admin"));
const roles = shallowRef<ApiPermissionRole[]>([]);
const catalog = shallowRef<ApiPermission[]>([]);
const selectedRole = shallowRef<ApiPermissionRole>();
const loadedRoleId = shallowRef<number>();
const selectedIds = shallowRef(new Set<number>());
const roleSearch = shallowRef("");
const catalogSearch = shallowRef("");
const rolesLoading = shallowRef(true);
const catalogLoading = shallowRef(true);
const grantLoading = shallowRef(false);
const saving = shallowRef(false);
const roleError = shallowRef("");
const catalogError = shallowRef("");
const grantError = shallowRef("");
const saveError = shallowRef("");
let requestVersion = 0;
let pendingSave: Promise<unknown> | undefined;

const readOnly = computed(() =>
  ["admin", "common"].includes(selectedRole.value?.code ?? ""),
);
const grantsReady = computed(() =>
  selectedRole.value !== undefined && loadedRoleId.value === selectedRole.value.id,
);
const canEditGrants = computed(() =>
  grantsReady.value && !readOnly.value && !catalogLoading.value &&
  !catalogError.value && !saving.value,
);
const filteredRoles = computed(() => {
  const query = roleSearch.value.trim().toLowerCase();
  return roles.value.filter((role) =>
    `${role.name} ${role.code}`.toLowerCase().includes(query),
  );
});
const groupedCatalog = computed(() => {
  const query = catalogSearch.value.trim().toLowerCase();
  const groups = new Map<string, ApiPermission[]>();
  for (const permission of catalog.value) {
    const { name, code, module, method, path } = permission;
    if (query && !`${name} ${code} ${module} ${method} ${path}`.toLowerCase().includes(query)) continue;
    const items = groups.get(module);
    if (items) items.push(permission);
    else groups.set(module, [permission]);
  }
  return [...groups.entries()];
});

function errorMessage(cause: unknown, fallback: string) {
  if (cause && typeof cause === "object" && "message" in cause &&
    typeof cause.message === "string" && cause.message) return cause.message;
  return fallback;
}

function togglePermission(permission: ApiPermission, checked: boolean) {
  if (!canEditGrants.value || !permission.assignable) return;
  const next = new Set(selectedIds.value);
  if (checked) next.add(permission.id);
  else next.delete(permission.id);
  selectedIds.value = next;
}

async function loadRolePermissions(role: ApiPermissionRole) {
  const version = ++requestVersion;
  selectedRole.value = role;
  loadedRoleId.value = undefined;
  selectedIds.value = new Set();
  grantError.value = "";
  saveError.value = "";
  grantLoading.value = true;
  try {
    // A quick switch back must not fetch from before an in-flight save.
    if (pendingSave) await pendingSave.catch(() => undefined);
    if (version !== requestVersion) return;
    const result = await getRoleApiPermissionIds({ id: role.id });
    if (version !== requestVersion) return;
    if (result.code !== 0 || !Array.isArray(result.data?.apiPermissionIds)) {
      throw new Error(result.message || "接口权限加载失败");
    }
    selectedIds.value = new Set(result.data.apiPermissionIds);
    loadedRoleId.value = role.id;
  } catch (cause) {
    if (version === requestVersion) {
      grantError.value = errorMessage(cause, "接口权限加载失败");
    }
  } finally {
    if (version === requestVersion) grantLoading.value = false;
  }
}

async function save() {
  const role = selectedRole.value;
  if (!role || !canEditGrants.value) return;
  const version = requestVersion;
  saveError.value = "";
  saving.value = true;
  try {
    const request = saveRoleApiPermissions({
      id: role.id,
      apiPermissionIds: [...selectedIds.value],
    });
    pendingSave = request;
    const result = await request;
    if (result.code !== 0) throw new Error(result.message || "接口权限保存失败");
    message(`角色 ${role.name} 的接口权限保存成功`, { type: "success" });
  } catch (cause) {
    const detail = errorMessage(cause, "接口权限保存失败");
    if (version === requestVersion) saveError.value = detail;
    else message(`角色 ${role.name}：${detail}`, { type: "error" });
  } finally {
    pendingSave = undefined;
    saving.value = false;
  }
}

async function loadRoles() {
  rolesLoading.value = true;
  roleError.value = "";
  try {
    const result = await listApiPermissionRoles();
    if (result.code !== 0 || !Array.isArray(result.data)) {
      throw new Error(result.message || "角色列表加载失败");
    }
    roles.value = result.data;
  } catch (cause) {
    roleError.value = errorMessage(cause, "角色列表加载失败");
  } finally {
    rolesLoading.value = false;
  }
}

async function loadCatalog() {
  catalogLoading.value = true;
  catalogError.value = "";
  try {
    const result = await listApiPermissions();
    if (result.code !== 0 || !Array.isArray(result.data)) {
      throw new Error(result.message || "接口目录加载失败");
    }
    catalog.value = result.data;
  } catch (cause) {
    catalogError.value = errorMessage(cause, "接口目录加载失败");
  } finally {
    catalogLoading.value = false;
  }
}

const catalogDialog = shallowRef(false);
const catalogSaving = shallowRef(false);
const catalogFormError = shallowRef("");
const catalogForm = reactive({
  id: 0, code: "", name: "", module: "", method: "GET", path: "",
  description: "", sort: 0, status: 1,
});

function editCatalog(permission?: ApiPermission) {
  if (!canEditCatalog.value || catalogSaving.value) return;
  Object.assign(catalogForm, {
    id: permission?.id ?? 0,
    code: permission?.code ?? "",
    name: permission?.name ?? "",
    module: permission?.module ?? "",
    method: permission?.method ?? "GET",
    path: permission?.path ?? "",
    description: permission?.description ?? "",
    sort: permission?.sort ?? 0,
    status: permission?.status ?? 1,
  });
  catalogFormError.value = "";
  catalogDialog.value = true;
}

async function saveCatalog() {
  if (!canEditCatalog.value || catalogSaving.value) return;
  const { id, code, name, module, method, path, description, sort, status } = catalogForm;
  const payload = {
    code: code.trim(), name: name.trim(), module: module.trim(),
    method: method.trim().toUpperCase(), path: path.trim(), description, sort, status,
  };
  if (!payload.code || !payload.name || !payload.module || !payload.method || !payload.path) {
    catalogFormError.value = "请填写编码、名称、模块、方法和路径";
    return;
  }
  catalogSaving.value = true;
  catalogFormError.value = "";
  try {
    const result = id
      ? await updateApiPermission({ id, ...payload })
      : await createApiPermission(payload);
    if (result.code !== 0) throw new Error(result.message || "接口目录保存失败");
    catalogDialog.value = false;
    message("接口目录保存成功", { type: "success" });
    await loadCatalog();
  } catch (cause) {
    catalogFormError.value = errorMessage(cause, "接口目录保存失败");
  } finally {
    catalogSaving.value = false;
  }
}

onMounted(() => {
  void loadRoles();
  void loadCatalog();
});
</script>

<template>
  <div class="flex flex-col gap-4 lg:flex-row">
    <el-card class="w-full shrink-0 lg:w-64" shadow="never">
      <template #header><span class="font-bold">角色</span></template>
      <el-input v-model="roleSearch" clearable placeholder="搜索角色名称或标识" aria-label="搜索角色" class="mb-3" />
      <el-skeleton v-if="rolesLoading" :rows="3" animated />
      <template v-else-if="roleError">
        <el-alert :title="roleError" type="error" show-icon :closable="false" />
        <el-button text type="primary" @click="loadRoles">重试</el-button>
      </template>
      <el-empty v-else-if="!filteredRoles.length" :description="roleSearch ? '没有匹配的角色' : '暂无角色'" :image-size="72" />
      <el-scrollbar v-else max-height="calc(100vh - 240px)">
        <button
          v-for="role in filteredRoles"
          :key="role.id"
          type="button"
          class="mb-1 block w-full rounded-sm px-3 py-2 text-left hover:bg-(--el-fill-color-light) aria-pressed:bg-(--el-color-primary-light-9) aria-pressed:text-(--el-color-primary)"
          :aria-pressed="role.id === selectedRole?.id"
          @click="role.id !== selectedRole?.id && loadRolePermissions(role)"
        >
          {{ role.name }} ({{ role.code }})
          <el-tag v-if="role.code === 'admin' || role.code === 'common'" size="small" type="info">只读</el-tag>
          <el-tag v-else-if="role.status !== 1" size="small" type="info">已停用</el-tag>
        </button>
      </el-scrollbar>
    </el-card>

    <el-card class="min-w-0 flex-1" shadow="never">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span class="font-bold">接口权限</span>
            <span v-if="selectedRole" class="ml-2 text-text_color_secondary">{{ selectedRole.name }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <el-button v-if="canEditCatalog" :disabled="catalogLoading || catalogSaving" @click="editCatalog()">新增接口</el-button>
            <el-button type="primary" :loading="saving" :disabled="!canEditGrants" @click="save">保存接口权限</el-button>
          </div>
        </div>
      </template>
      <el-alert v-if="!selectedRole" title="请选择角色以查看接口授权" type="info" show-icon :closable="false" class="mb-3" />
      <el-alert v-else-if="readOnly" title="内置角色的接口权限为只读" type="info" show-icon :closable="false" class="mb-3" />
      <el-alert v-if="saveError" :title="saveError" type="error" show-icon :closable="false" class="mb-3" />
      <template v-if="grantError && selectedRole">
        <el-alert :title="grantError" type="error" show-icon :closable="false" />
        <el-button text type="primary" @click="loadRolePermissions(selectedRole)">重试读取授权</el-button>
      </template>
      <el-input
        v-model="catalogSearch" clearable class="mb-3" aria-label="搜索接口"
        placeholder="搜索名称、模块、方法、路径或权限编码"
      />
      <el-skeleton v-if="catalogLoading || grantLoading" :rows="8" animated />
      <template v-else-if="catalogError">
        <el-alert :title="catalogError" type="error" show-icon :closable="false" />
        <el-button text type="primary" @click="loadCatalog">重试读取接口目录</el-button>
      </template>
      <el-empty v-else-if="!groupedCatalog.length" :description="catalogSearch ? '没有匹配的接口' : '暂无接口权限'" />
      <el-scrollbar v-else max-height="calc(100vh - 280px)">
        <section v-for="[module, permissions] in groupedCatalog" :key="module" class="mb-4">
          <h3 class="mb-1 font-bold">{{ module || "未分组" }}</h3>
          <div
            v-for="permission in permissions" :key="permission.id"
            class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-(--el-border-color-lighter) py-2"
          >
            <el-checkbox
              v-if="grantsReady"
              :model-value="selectedIds.has(permission.id)"
              :disabled="!canEditGrants || !permission.assignable"
              :aria-label="permission.name"
              @change="togglePermission(permission, $event === true)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span>{{ permission.name }}</span>
                <el-tag size="small">{{ permission.method }}</el-tag>
                <el-tag v-if="!permission.assignable" size="small" type="info">不可分配</el-tag>
                <el-tag v-if="permission.status === 0" size="small" type="info">已停用</el-tag>
              </div>
              <div class="mt-1 wrap-anywhere text-xs text-text_color_secondary">
                {{ permission.path }} · {{ permission.code }}
              </div>
            </div>
            <el-button v-if="canEditCatalog" link type="primary" @click="editCatalog(permission)">编辑接口</el-button>
          </div>
        </section>
      </el-scrollbar>
    </el-card>

    <el-dialog
      v-if="canEditCatalog" v-model="catalogDialog"
      :title="catalogForm.id ? '编辑接口' : '新增接口'"
      width="min(520px, 95vw)" :close-on-click-modal="!catalogSaving"
      :close-on-press-escape="!catalogSaving" :show-close="!catalogSaving"
    >
      <el-alert v-if="catalogFormError" :title="catalogFormError" type="error" show-icon :closable="false" class="mb-3" />
      <el-form label-position="top" :disabled="catalogSaving" @submit.prevent="saveCatalog">
        <el-form-item label="权限编码" required><el-input v-model="catalogForm.code" maxlength="128" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="catalogForm.name" maxlength="128" /></el-form-item>
        <el-form-item label="模块" required><el-input v-model="catalogForm.module" maxlength="64" /></el-form-item>
        <el-form-item label="方法" required><el-input v-model="catalogForm.method" maxlength="16" /></el-form-item>
        <el-form-item label="路径" required><el-input v-model="catalogForm.path" maxlength="255" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="catalogForm.description" type="textarea" maxlength="255" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="catalogForm.sort" :precision="0" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="catalogForm.status" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="catalogSaving" @click="catalogDialog = false">取消</el-button>
        <el-button type="primary" :loading="catalogSaving" @click="saveCatalog">保存接口定义</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { ElMessageBox } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useUserStoreHook } from "@/store/modules/user";
import { message } from "@/utils/message";
import {
  listApiPermissionRoles,
  listApiPermissions,
  type ApiPermission,
  type ApiPermissionRole,
} from "@/api/system";
import ApiCatalogDialog from "./components/ApiCatalogDialog.vue";
import { useRoleApiGrants } from "./useRoleApiGrants";
import SearchIcon from "~icons/ri/search-line";
import RoleIcon from "~icons/ri/shield-user-line";
import PermissionIcon from "~icons/ri/shield-keyhole-line";
import RefreshIcon from "~icons/ri/refresh-line";
import AddIcon from "~icons/ri/add-circle-line";
import SaveIcon from "~icons/ri/save-line";
import EditIcon from "~icons/ri/edit-line";

defineOptions({ name: "SystemApiPermission" });

const canEditCatalog = computed(() => useUserStoreHook().roles.includes("admin"));
const roles = shallowRef<ApiPermissionRole[]>([]);
const catalog = shallowRef<ApiPermission[]>([]);
const rolesLoading = shallowRef(true);
const catalogLoading = shallowRef(true);
const roleError = shallowRef("");
const catalogError = shallowRef("");
const roleSearch = shallowRef("");
const keyword = shallowRef("");
const moduleFilter = shallowRef("");
const methodFilter = shallowRef("");
const grantFilter = shallowRef("");
const page = shallowRef(1);
const pageSize = shallowRef(10);
const catalogDialog = shallowRef(false);
const editingPermission = shallowRef<ApiPermission | null>(null);
const {
  role, selectedIds, loading: grantLoading, saving, loadError, saveError,
  ready, changes, dirty, load, update, discard, save,
} = useRoleApiGrants();
const canEditGrants = computed(() => ready.value && !saving.value &&
  !catalogLoading.value && !catalogError.value);
const isAdminRole = computed(() => role.value?.code === "admin");
const isBuiltInRole = computed(() => ["admin", "common"].includes(role.value?.code ?? ""));
const isGranted = (id: number) => ready.value && selectedIds.value.has(id);
const grantedCount = computed(() => ready.value
  ? catalog.value.filter(permission => isGranted(permission.id)).length : 0);
const filteredRoles = computed(() => {
  const query = roleSearch.value.trim().toLowerCase();
  return roles.value.filter(item => `${item.name} ${item.code}`.toLowerCase().includes(query));
});
const modules = computed(() => [...new Set(catalog.value.map(item => item.module))]);
const methods = computed(() => [...new Set(catalog.value.map(item => item.method))]);
const filteredCatalog = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  return catalog.value.filter(item => {
    if (query && !`${item.name} ${item.path} ${item.code}`.toLowerCase().includes(query)) return false;
    if (moduleFilter.value && item.module !== moduleFilter.value) return false;
    if (methodFilter.value && item.method !== methodFilter.value) return false;
    if (grantFilter.value && (!ready.value || isGranted(item.id) !== (grantFilter.value === "granted"))) return false;
    return true;
  });
});
const pageCount = computed(() => Math.max(1, Math.ceil(filteredCatalog.value.length / pageSize.value)));
const currentPage = computed({
  get: () => Math.min(page.value, pageCount.value),
  set: value => { page.value = value; },
});
const pageRows = computed(() => filteredCatalog.value.slice(
  (currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value,
));
const editableFilteredIds = computed(() => filteredCatalog.value.filter(item => item.assignable).map(item => item.id));
const selectedFilteredCount = computed(() => editableFilteredIds.value.filter(id => selectedIds.value.has(id)).length);
const allFilteredSelected = computed(() => editableFilteredIds.value.length > 0 &&
  selectedFilteredCount.value === editableFilteredIds.value.length);
const partialFilteredSelected = computed(() => selectedFilteredCount.value > 0 && !allFilteredSelected.value);
const columns: TableColumnList = [
  { label: "授权", slot: "grant", width: 70, align: "center" },
  { label: "接口名称", prop: "name", minWidth: 150 },
  { label: "请求方法", slot: "method", width: 100 },
  { label: "接口路径 / 权限编码", slot: "endpoint", minWidth: 260 },
  { label: "所属模块", prop: "module", minWidth: 110 },
  { label: "状态", slot: "status", width: 90 },
  ...(canEditCatalog.value ? [{ label: "操作", slot: "operation", width: 90, fixed: "right" as const }] : []),
];
const headerCellStyle = { background: "var(--el-fill-color-light)", color: "var(--el-text-color-primary)" };

function errorMessage(cause: unknown, fallback: string) {
  return cause && typeof cause === "object" && "message" in cause && typeof cause.message === "string"
    ? cause.message : fallback;
}

async function confirmDiscard() {
  if (saving.value) return false;
  if (!dirty.value) return true;
  try {
    await ElMessageBox.confirm("当前角色的接口授权尚未保存，是否放弃修改？", "未保存的修改", {
      type: "warning", confirmButtonText: "放弃修改", cancelButtonText: "继续编辑",
    });
    discard();
    return true;
  } catch {
    return false;
  }
}

async function selectRole(nextRole: ApiPermissionRole) {
  if (nextRole.id === role.value?.id || !(await confirmDiscard())) return;
  grantFilter.value = "";
  page.value = 1;
  await load(nextRole);
}

async function saveGrants() {
  if (!canEditGrants.value) return;
  if (await save()) message("接口授权已保存", { type: "success" });
}

let rolesRequestVersion = 0;
let catalogRequestVersion = 0;

async function loadRoles() {
  const version = ++rolesRequestVersion;
  rolesLoading.value = true;
  roleError.value = "";
  try {
    const result = await listApiPermissionRoles();
    if (version !== rolesRequestVersion) return;
    if (result.code !== 0 || !Array.isArray(result.data)) throw new Error(result.message || "角色列表加载失败");
    roles.value = result.data;
    if (!role.value && result.data.length) await load(result.data[0]);
  } catch (cause) {
    if (version === rolesRequestVersion) roleError.value = errorMessage(cause, "角色列表加载失败");
  } finally {
    if (version === rolesRequestVersion) rolesLoading.value = false;
  }
}

async function loadCatalog() {
  const version = ++catalogRequestVersion;
  catalogLoading.value = true;
  catalogError.value = "";
  try {
    const result = await listApiPermissions();
    if (version !== catalogRequestVersion) return;
    if (result.code !== 0 || !Array.isArray(result.data)) throw new Error(result.message || "接口目录加载失败");
    catalog.value = result.data;
  } catch (cause) {
    if (version === catalogRequestVersion) catalogError.value = errorMessage(cause, "接口目录加载失败");
  } finally {
    if (version === catalogRequestVersion) catalogLoading.value = false;
  }
}

async function refresh() {
  if (!(await confirmDiscard())) return;
  await Promise.all([loadCatalog(), role.value ? load(role.value) : loadRoles()]);
}

function resetFilters() {
  keyword.value = "";
  moduleFilter.value = "";
  methodFilter.value = "";
  grantFilter.value = "";
  page.value = 1;
}

function editCatalog(permission: ApiPermission | null = null) {
  editingPermission.value = permission;
  catalogDialog.value = true;
}

function methodType(method: string) {
  if (method === "GET") return "success";
  if (method === "DELETE") return "danger";
  if (method === "PUT" || method === "PATCH") return "warning";
  return "primary";
}

function warnUnsavedChanges(event: BeforeUnloadEvent) {
  if (!dirty.value) return;
  event.preventDefault();
  event.returnValue = "";
}

onBeforeRouteLeave(confirmDiscard);
onMounted(() => {
  window.addEventListener("beforeunload", warnUnsavedChanges);
  void loadRoles();
  void loadCatalog();
});
onBeforeUnmount(() => window.removeEventListener("beforeunload", warnUnsavedChanges));
</script>

<template>
  <div class="main permission-page">
    <aside class="role-panel">
      <div class="role-panel__heading">
        <span class="panel-title">角色列表</span>
        <el-tag size="small" type="info" round>{{ roles.length }}</el-tag>
      </div>
      <div class="role-panel__search">
        <el-input v-model="roleSearch" clearable placeholder="搜索角色名称或标识" aria-label="搜索角色" :prefix-icon="useRenderIcon(SearchIcon)" />
      </div>
      <div v-if="rolesLoading" class="role-panel__state"><el-skeleton :rows="4" animated /></div>
      <div v-else-if="roleError" class="role-panel__state">
        <el-alert :title="roleError" type="error" show-icon :closable="false" />
        <el-button class="retry-button" @click="loadRoles">重新加载</el-button>
      </div>
      <el-empty v-else-if="!filteredRoles.length" :image-size="64" description="暂无匹配角色" />
      <el-scrollbar v-else max-height="560px" class="role-panel__list">
        <button
          v-for="item in filteredRoles" :key="item.id" type="button" class="role-option"
          :class="{ 'is-active': item.id === role?.id }" :aria-pressed="item.id === role?.id"
          :aria-label="`${item.name} (${item.code})`" :disabled="saving" @click="selectRole(item)"
        >
          <span class="role-option__icon"><RoleIcon /></span>
          <span class="role-option__body"><span class="role-option__name">{{ item.name }}</span><span class="role-option__code">{{ item.code }}</span></span>
          <el-tag v-if="['admin', 'common'].includes(item.code)" size="small" type="info" effect="plain">内置 · 可编辑</el-tag>
          <el-tag v-else-if="item.status !== 1" size="small" type="info" effect="plain">停用</el-tag>
        </button>
      </el-scrollbar>
      <div class="role-panel__hint">选择角色，配置可访问的接口。<br>页面与按钮权限在角色管理中配置。</div>
    </aside>

    <section class="permission-content">
      <div class="permission-context">
        <div class="permission-context__heading">
          <span class="context-icon"><PermissionIcon /></span>
          <div><h2 class="panel-title">接口权限管理</h2><p class="context-description">{{ role ? `${role.name} · ${role.code}` : '选择角色后配置接口访问权限' }}</p></div>
        </div>
        <el-tag v-if="dirty" type="warning" effect="plain">有未保存的修改</el-tag>
      </div>

      <el-form class="permission-filters" :inline="true" @submit.prevent>
        <el-form-item label="接口搜索">
          <el-input v-model="keyword" class="keyword-input" clearable placeholder="名称 / 路径 / 权限编码" aria-label="搜索接口" :prefix-icon="useRenderIcon(SearchIcon)" @input="page = 1" />
        </el-form-item>
        <el-form-item label="所属模块">
          <el-select v-model="moduleFilter" class="module-select" clearable placeholder="全部模块" aria-label="所属模块" @change="page = 1">
            <el-option v-for="item in modules" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="请求方法">
          <el-select v-model="methodFilter" class="method-select" clearable placeholder="全部方法" aria-label="请求方法筛选" @change="page = 1">
            <el-option v-for="item in methods" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="授权状态">
          <el-select v-model="grantFilter" class="grant-select" clearable :disabled="!ready" placeholder="全部" aria-label="授权状态筛选" @change="page = 1">
            <el-option label="已授权" value="granted" /><el-option label="未授权" value="ungranted" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button :icon="useRenderIcon(RefreshIcon)" @click="resetFilters">重置</el-button></el-form-item>
      </el-form>

      <div class="permission-table-panel">
        <PureTableBar title="接口列表" :columns="columns" @refresh="refresh">
          <template #buttons>
            <Auth value="system-api-permission:add">
              <el-button v-if="canEditCatalog" :icon="useRenderIcon(AddIcon)" @click="editCatalog()">新增接口</el-button>
            </Auth>
            <Auth value="system-api-permission:save">
              <el-button type="primary" :icon="useRenderIcon(SaveIcon)" :loading="saving" :disabled="!canEditGrants || !dirty" @click="saveGrants">保存授权</el-button>
            </Auth>
          </template>
          <template #default="{ size, dynamicColumns }">
            <div class="grant-summary">
              <span v-if="!role">请选择左侧角色后配置接口授权</span>
              <span v-else-if="isAdminRole">超级管理员接口授权可编辑，勾选后保存生效。</span>
              <span v-else-if="isBuiltInRole">内置角色接口授权可编辑，勾选后保存生效。</span>
              <span v-else-if="role.status !== 1">该角色已停用，保存的授权将在角色启用后生效。</span>
              <span v-else>勾选角色可访问的接口，保存后生效。禁用的接口不会放行请求。</span>
              <span v-if="ready" class="grant-summary__count">已授权 <strong>{{ grantedCount }}</strong> / {{ catalog.length }}</span>
            </div>
            <div v-if="catalogError || loadError || saveError" class="permission-error">
              <el-alert :title="catalogError || loadError || saveError" type="error" show-icon :closable="false" />
              <el-button v-if="catalogError || loadError" @click="refresh">重试</el-button>
            </div>
            <div class="grant-batch">
              <el-checkbox :model-value="allFilteredSelected" :indeterminate="partialFilteredSelected" :disabled="!canEditGrants || !editableFilteredIds.length" @change="update(editableFilteredIds, $event === true)">全选当前筛选结果</el-checkbox>
              <span class="muted">共 {{ filteredCatalog.length }} 个接口</span>
              <el-button v-if="dirty" link type="primary" :disabled="saving" @click="discard">撤销本次修改</el-button>
            </div>
            <pure-table
              row-key="id" :data="pageRows" :columns="dynamicColumns" :size="size" show-overflow-tooltip
              :loading="catalogLoading || grantLoading" :header-cell-style="headerCellStyle"
              :pagination="{ total: filteredCatalog.length, pageSize, currentPage, pageSizes: [10, 20, 50], background: true }"
              @page-size-change="pageSize = $event; page = 1" @page-current-change="currentPage = $event"
            >
              <template #grant="{ row }">
                <el-tooltip v-if="ready" :disabled="row.assignable" content="不能分配自身未拥有的接口权限" placement="top">
                  <span><el-checkbox :aria-label="`授权 ${row.name}`" :model-value="isGranted(row.id)" :disabled="!canEditGrants || !row.assignable" @change="update([row.id], $event === true)" /></span>
                </el-tooltip>
                <span v-else class="muted">—</span>
              </template>
              <template #method="{ row }"><el-tag :type="methodType(row.method)" effect="light" size="small" class="method-tag">{{ row.method }}</el-tag></template>
              <template #endpoint="{ row }"><div class="endpoint-path">{{ row.path }}</div><div class="endpoint-code">{{ row.code }}</div></template>
              <template #status="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'" effect="plain" size="small">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template>
              <template #operation="{ row }"><el-button link type="primary" :size="size" :icon="useRenderIcon(EditIcon)" @click="editCatalog(row)">修改</el-button></template>
              <template #empty><el-empty :image-size="64" :description="catalogError ? '接口目录加载失败' : '暂无匹配接口'" /></template>
            </pure-table>
            <div v-if="dirty" class="changes-note" role="status">待保存：新增 {{ changes.added }} 项授权，取消 {{ changes.removed }} 项授权。筛选和翻页不会丢失勾选。</div>
          </template>
        </PureTableBar>
      </div>
    </section>
    <ApiCatalogDialog v-if="canEditCatalog" v-model="catalogDialog" :permission="editingPermission" @saved="loadCatalog" />
  </div>
</template>

<style lang="scss" scoped>
.permission-page {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  align-items: start;
  gap: 16px;
  color: var(--el-text-color-primary);
}
.role-panel, .permission-context, .permission-filters, .permission-table-panel {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
}
.role-panel { overflow: hidden; }
.role-panel__heading { display: flex; align-items: center; justify-content: space-between; padding: 20px; border-bottom: 1px solid var(--el-border-color-lighter); }
.panel-title { margin: 0; font-size: 16px; font-weight: 600; line-height: 24px; }
.role-panel__search { padding: 16px 16px 8px; }
.role-panel__list { padding: 4px 8px 12px; }
.role-panel__state { padding: 20px 16px; }
.role-option {
  display: flex; align-items: center; gap: 10px; width: 100%; margin: 4px 0; padding: 12px 10px;
  font: inherit; color: var(--el-text-color-regular); text-align: left; background: transparent;
  border: 1px solid transparent; border-radius: var(--el-border-radius-base); cursor: pointer;
  transition: background-color .15s, border-color .15s;
}
.role-option:hover { background: var(--el-fill-color-light); }
.role-option.is-active { color: var(--el-color-primary); background: var(--el-color-primary-light-9); border-color: var(--el-color-primary-light-7); }
.role-option:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
.role-option:disabled { cursor: not-allowed; }
.role-option__icon { display: flex; flex: 0 0 32px; align-items: center; justify-content: center; height: 32px; font-size: 20px; }
.role-option__body { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; }
.role-option__name { overflow: hidden; font-size: 14px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.role-option__code { overflow: hidden; color: var(--el-text-color-secondary); font-size: 12px; text-overflow: ellipsis; }
.role-panel__hint { padding: 16px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.8; border-top: 1px solid var(--el-border-color-lighter); }
.permission-content { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.permission-context { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 24px; }
.permission-context__heading { display: flex; align-items: center; gap: 12px; min-width: 0; }
.context-icon { display: flex; flex: 0 0 40px; align-items: center; justify-content: center; height: 40px; color: var(--el-color-primary); font-size: 22px; background: var(--el-color-primary-light-9); border-radius: var(--el-border-radius-base); }
.context-description { margin: 4px 0 0; color: var(--el-text-color-secondary); font-size: 13px; overflow-wrap: anywhere; }
.permission-filters { padding: 18px 24px 0; }
.permission-filters :deep(.el-form-item) { margin-right: 20px; margin-bottom: 18px; }
.keyword-input { width: 236px; }
.module-select { width: 150px; }
.method-select { width: 130px; }
.grant-select { width: 120px; }
.permission-table-panel { overflow: hidden; }
.permission-table-panel :deep(.el-table__inner-wrapper::before) { height: 0; }
.grant-summary { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin: 0 16px 12px; padding: 12px 16px; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.6; background: var(--el-fill-color-lighter); border-radius: var(--el-border-radius-base); }
.grant-summary__count { flex-shrink: 0; }
.grant-summary__count strong { color: var(--el-color-primary); font-size: 16px; }
.grant-batch { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; padding: 0 20px 12px; }
.grant-batch :deep(.el-checkbox__label) { font-weight: 400; }
.muted { color: var(--el-text-color-secondary); font-size: 13px; }
.method-tag { min-width: 58px; text-align: center; font-family: var(--el-font-family); }
.endpoint-path { color: var(--el-text-color-primary); font-family: monospace; font-size: 13px; line-height: 22px; }
.endpoint-code { color: var(--el-text-color-secondary); font-size: 12px; line-height: 20px; }
.permission-error { display: flex; align-items: center; gap: 12px; padding: 0 16px 12px; }
.retry-button { margin-top: 12px; }
.changes-note { padding: 12px 20px; color: var(--el-color-warning); font-size: 13px; border-top: 1px solid var(--el-border-color-lighter); }
@media (max-width: 1100px) {
  .permission-page { grid-template-columns: 210px minmax(0, 1fr); }
  .permission-filters { padding-right: 16px; padding-left: 16px; }
}
@media (max-width: 760px) {
  .permission-page { grid-template-columns: minmax(0, 1fr); }
  .role-panel__list { max-height: 220px; }
  .permission-context { padding: 16px; }
  .permission-filters :deep(.el-form-item) { display: flex; margin-right: 0; }
  .permission-filters :deep(.el-form-item__content) { min-width: 0; }
  .keyword-input, .module-select, .method-select, .grant-select { width: 100%; }
}
</style>

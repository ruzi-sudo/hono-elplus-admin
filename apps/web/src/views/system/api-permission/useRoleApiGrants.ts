import { computed, shallowRef } from "vue";
import {
  getRoleApiPermissionIds,
  saveRoleApiPermissions,
  type ApiPermissionRole,
} from "@/api/system";

export function useRoleApiGrants() {
  const role = shallowRef<ApiPermissionRole>();
  const selectedIds = shallowRef<ReadonlySet<number>>(new Set());
  const savedIds = shallowRef<ReadonlySet<number>>(new Set());
  const loadedRoleId = shallowRef<number>();
  const loading = shallowRef(false);
  const saving = shallowRef(false);
  const loadError = shallowRef("");
  const saveError = shallowRef("");
  let requestVersion = 0;

  const ready = computed(() => role.value !== undefined && loadedRoleId.value === role.value.id);
  const changes = computed(() => ({
    added: [...selectedIds.value].filter(id => !savedIds.value.has(id)).length,
    removed: [...savedIds.value].filter(id => !selectedIds.value.has(id)).length,
  }));
  const dirty = computed(() => changes.value.added + changes.value.removed > 0);

  function errorMessage(cause: unknown, fallback: string) {
    return cause && typeof cause === "object" && "message" in cause && typeof cause.message === "string"
      ? cause.message : fallback;
  }

  async function load(nextRole: ApiPermissionRole) {
    if (saving.value) return;
    const version = ++requestVersion;
    role.value = nextRole;
    loadedRoleId.value = undefined;
    selectedIds.value = new Set();
    savedIds.value = new Set();
    loadError.value = "";
    saveError.value = "";
    loading.value = true;
    try {
      const result = await getRoleApiPermissionIds({ id: nextRole.id });
      if (version !== requestVersion) return;
      if (result.code !== 0 || !Array.isArray(result.data?.apiPermissionIds)) {
        throw new Error(result.message || "接口授权加载失败");
      }
      const ids = new Set(result.data.apiPermissionIds);
      selectedIds.value = ids;
      savedIds.value = ids;
      loadedRoleId.value = nextRole.id;
    } catch (cause) {
      if (version === requestVersion) loadError.value = errorMessage(cause, "接口授权加载失败");
    } finally {
      if (version === requestVersion) loading.value = false;
    }
  }

  function update(ids: number[], checked: boolean) {
    if (!ready.value || saving.value) return;
    const next = new Set(selectedIds.value);
    for (const id of ids) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    selectedIds.value = next;
    saveError.value = "";
  }

  function discard() {
    if (saving.value) return;
    selectedIds.value = savedIds.value;
    saveError.value = "";
  }

  async function save(): Promise<boolean> {
    if (!role.value || !ready.value || saving.value || !dirty.value) return false;
    const ids = selectedIds.value;
    saving.value = true;
    saveError.value = "";
    try {
      const result = await saveRoleApiPermissions({ id: role.value.id, apiPermissionIds: [...ids] });
      if (result.code !== 0) throw new Error(result.message || "接口授权保存失败");
      savedIds.value = ids;
      return true;
    } catch (cause) {
      saveError.value = errorMessage(cause, "接口授权保存失败");
      return false;
    } finally {
      saving.value = false;
    }
  }

  return {
    role, selectedIds, loading, saving, loadError, saveError,
    ready, changes, dirty, load, update, discard, save,
  };
}

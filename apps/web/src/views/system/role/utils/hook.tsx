import dayjs from "dayjs";
import editForm from "../form.vue";
import { handleTree } from "@/utils/tree";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { usePublicHooks } from "../../hooks";
import { transformI18n } from "@/plugins/i18n";
import { addDialog, closeAllDialog } from "@/components/ReDialog";
import type { FormItemProps } from "../utils/types";
import type { PaginationProps } from "@pureadmin/table";
import { getKeyList, deviceDetection } from "@pureadmin/utils";
import {
  getRoleList,
  getRoleMenu,
  getRoleMenuIds,
  createRole,
  updateRole,
  deleteRole,
  saveRoleMenu,
} from "@/api/system";
import {
  type Ref,
  computed,
  reactive,
  ref,
  nextTick,
  onMounted,
  h,
  toRaw,
  watch,
} from "vue";

type RoleMenuItem = {
  id: number;
  menuType: number;
  title: string;
  path: string;
  component: string;
  status: number;
};
export function useRole(treeRef: Ref) {
  const form = reactive({
    name: "",
    code: "",
    status: "",
  });
  const curRow = ref();
  const formRef = ref();
  const dataList = ref([]);
  const treeIds = ref([]);
  const treeData = ref([]);
  const menuPages = ref<RoleMenuItem[]>([]);
  const checkedMenuIds = ref<number[]>([]);
  const homePageId = ref<number | null>(null);
  const isShow = ref(false);
  const menuLoading = ref(false);
  const menuReady = ref(false);
  const menuSaving = ref(false);
  const menuError = ref("");
  const menuTab = ref("menu");
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();
  const switchLoadMap = ref({});
  const isExpandAll = ref(false);
  const homePageOptions = computed(() =>
    menuPages.value.filter((item) => checkedMenuIds.value.includes(item.id)),
  );
  const { switchStyle } = usePublicHooks();
  const treeProps = {
    value: "id",
    label: "title",
    children: "children",
  };
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true,
  });
  const columns: TableColumnList = [
    {
      label: "角色编号",
      prop: "id",
    },
    {
      label: "角色名称",
      prop: "name",
    },
    {
      label: "角色标识",
      prop: "code",
    },
    {
      label: "状态",
      cellRenderer: (scope) => (
        <el-switch
          size={scope.props.size === "small" ? "small" : "default"}
          loading={switchLoadMap.value[scope.index]?.loading}
          v-model={scope.row.status}
          active-value={1}
          inactive-value={0}
          active-text="已启用"
          inactive-text="已停用"
          inline-prompt
          style={switchStyle.value}
          onChange={() => onChange(scope as any)}
        />
      ),
      minWidth: 90,
    },
    {
      label: "备注",
      prop: "remark",
      minWidth: 160,
    },
    {
      label: "创建时间",
      prop: "createTime",
      minWidth: 160,
      formatter: ({ createTime }) =>
        dayjs(createTime).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      label: "操作",
      fixed: "right",
      width: 210,
      slot: "operation",
    },
  ];
  // const buttonClass = computed(() => {
  //   return [
  //     "h-5!",
  //     "reset-margin",
  //     "text-gray-500!",
  //     "dark:text-white!",
  //     "dark:hover:text-primary!"
  //   ];
  // });

  async function onChange({ row, index }) {
    try {
      await ElMessageBox.confirm(
        `确认要<strong>${row.status === 0 ? "停用" : "启用"}</strong><strong style='color:var(--el-color-primary)'>${row.name}</strong>吗?`,
        "系统提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
          dangerouslyUseHTMLString: true,
          draggable: true,
        },
      );
    } catch {
      row.status === 0 ? (row.status = 1) : (row.status = 0);
      return;
    }
    switchLoadMap.value[index] = {
      ...switchLoadMap.value[index],
      loading: true,
    };
    const { code } = await updateRole({ id: row.id, status: row.status });
    switchLoadMap.value[index] = {
      ...switchLoadMap.value[index],
      loading: false,
    };
    if (code === 0) {
      message(`已${row.status === 0 ? "停用" : "启用"}${row.name}`, {
        type: "success",
      });
    } else {
      row.status === 0 ? (row.status = 1) : (row.status = 0);
    }
  }

  async function handleDelete(row) {
    const { code, message: msg } = await deleteRole({ id: row.id });
    if (code === 0) {
      message(`已删除角色 ${row.name}`, { type: "success" });
      onSearch();
    } else {
      message(msg || "删除失败", { type: "error" });
    }
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    pagination.currentPage = 1;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    const { code, data } = await getRoleList({
      ...toRaw(form),
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize,
    });
    if (code === 0) {
      dataList.value = data.list;
      pagination.total = data.total;
      pagination.pageSize = data.pageSize;
      pagination.currentPage = data.currentPage;
    }

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  const resetForm = (formEl) => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  function openDialog(title = "新增", row?: FormItemProps) {
    closeAllDialog();
    addDialog({
      title: `${title}角色`,
      props: {
        formInline: {
          id: row?.id ?? null,
          name: row?.name ?? "",
          code: row?.code ?? "",
          remark: row?.remark ?? "",
        },
      },
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: async (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        FormRef.validate(async (valid) => {
          if (valid) {
            if (title === "新增") {
              const { code, message: msg } = await createRole(curData);
              if (code !== 0) {
                message(msg || "创建失败", { type: "error" });
                return;
              }
              message(`已新增角色 ${curData.name}`, { type: "success" });
            } else {
              const { code, message: msg } = await updateRole({
                id: curData.id,
                ...curData,
              });
              if (code !== 0) {
                message(msg || "修改失败", { type: "error" });
                return;
              }
              message(`已修改角色 ${curData.name}`, { type: "success" });
            }
            done();
            onSearch();
          }
        });
      },
    });
  }

  let permissionRequest = 0;
  let catalogRequest: Promise<void> | undefined;
  let pendingSave: Promise<unknown> | undefined;

  function permissionError(error: unknown, fallback: string) {
    return error && typeof error === "object" && "message" in error &&
      typeof error.message === "string" && error.message
      ? error.message
      : fallback;
  }

  function loadMenuCatalog() {
    catalogRequest ??= (async () => {
      try {
        const { code, data, message: msg } = await getRoleMenu();
        if (code !== 0 || !Array.isArray(data)) {
          throw new Error(msg || "菜单目录加载失败");
        }
        treeIds.value = getKeyList(data, "id");
        treeData.value = handleTree(data);
        menuPages.value = data.filter(
          (item: RoleMenuItem) =>
            item.menuType === 0 && item.status === 1 && item.path &&
            item.path !== "/" && item.component,
        );
      } catch (error) {
        catalogRequest = undefined;
        throw error;
      }
    })();
    return catalogRequest;
  }

  async function handleMenu(row?: { id?: number; name?: string } | null) {
    const requestId = ++permissionRequest;
    const id = row?.id;
    menuReady.value = false;
    menuError.value = "";
    menuLoading.value = Boolean(id);
    curRow.value = id ? row : null;
    isShow.value = Boolean(id);
    checkedMenuIds.value = [];
    homePageId.value = null;
    menuTab.value = "menu";
    treeSearchValue.value = "";
    isExpandAll.value = false;
    isLinkage.value = false;
    treeRef.value?.setCheckedKeys([]);
    if (!id) return;
    try {
      // Don't reload a role from before a pending write has settled.
      if (pendingSave) await pendingSave.catch(() => undefined);
      if (requestId !== permissionRequest) return;
      const [{ code, data, message: msg }] = await Promise.all([
        getRoleMenuIds({ id }),
        loadMenuCatalog(),
      ]);
      if (requestId !== permissionRequest) return;
      if (code !== 0 || !Array.isArray(data?.menuIds)) {
        throw new Error(msg || "菜单权限加载失败");
      }
      await nextTick();
      if (requestId !== permissionRequest) return;
      const tree = treeRef.value;
      if (!tree) throw new Error("菜单树加载失败");
      tree.filter("");
      tree.setCheckedKeys(data.menuIds);
      checkedMenuIds.value = data.menuIds;
      homePageId.value = data.homePageId;
      menuReady.value = true;
    } catch (error) {
      if (requestId === permissionRequest) {
        menuError.value = permissionError(error, "菜单权限加载失败");
      }
    } finally {
      if (requestId === permissionRequest) menuLoading.value = false;
    }
  }
  function handleTreeCheck(_node, { checkedKeys }) {
    if (!menuReady.value || menuSaving.value) return;
    checkedMenuIds.value = checkedKeys as number[];
    if (
      homePageId.value !== null &&
      !checkedMenuIds.value.includes(homePageId.value)
    ) {
      homePageId.value = null;
    }
  }

  /** 高亮当前权限选中行 */
  function rowStyle({ row: { id } }) {
    return {
      cursor: "pointer",
      background: id === curRow.value?.id ? "var(--el-fill-color-light)" : "",
    };
  }

  async function handleSave() {
    const row = curRow.value;
    if (!row?.id || !menuReady.value || menuSaving.value) return;
    const requestId = permissionRequest;
    menuSaving.value = true;
    try {
      const request = saveRoleMenu({
        id: row.id,
        menuIds: [...checkedMenuIds.value],
        homePageId: homePageId.value ?? null,
      });
      pendingSave = request;
      const { code, message: msg } = await request;
      if (requestId !== permissionRequest) return;
      if (code !== 0) throw new Error(msg || "菜单权限保存失败");
      message(`角色 ${row.name} 的菜单权限修改成功`, { type: "success" });
    } catch (error) {
      if (requestId === permissionRequest) {
        message(permissionError(error, "菜单权限保存失败"), { type: "error" });
      }
    } finally {
      pendingSave = undefined;
      menuSaving.value = false;
    }
  }


  /** 数据权限 可自行开发 */
  // function handleDatabase() {}

  const onQueryChanged = (query: string) => {
    treeRef.value?.filter(query);
  };

  const filterMethod = (query: string, node) => {
    return transformI18n(node.title)!.includes(query);
  };

  onMounted(onSearch);

  watch(isExpandAll, (val) => {
    treeRef.value?.setExpandedKeys(val ? treeIds.value : []);
  });

  const isSelectAll = computed({
    get: () => treeIds.value.length > 0 &&
      treeIds.value.every((id) => checkedMenuIds.value.includes(id)),
    set: (val: boolean) => {
      if (!menuReady.value || menuSaving.value) return;
      const checkedKeys = val ? treeIds.value : [];
      treeRef.value?.setCheckedKeys(checkedKeys);
      checkedMenuIds.value = checkedKeys;
      if (!val) homePageId.value = null;
    },
  });

  return {
    form,
    isShow,
    curRow,
    loading,
    columns,
    rowStyle,
    dataList,
    treeData,
    treeProps,
    homePageId,
    homePageOptions,
    menuLoading,
    menuReady,
    menuSaving,
    menuError,
    menuTab,
    isLinkage,
    pagination,
    isExpandAll,
    isSelectAll,
    treeSearchValue,
    // buttonClass,
    onSearch,
    resetForm,
    openDialog,
    handleMenu,
    handleTreeCheck,
    handleSave,
    handleDelete,
    filterMethod,
    transformI18n,
    onQueryChanged,
    // handleDatabase,
    handleSizeChange,
    handleCurrentChange,
  };
}

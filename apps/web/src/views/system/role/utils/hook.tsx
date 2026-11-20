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
  getRolePermissions,
  listApiPermissions,
  createApiPermission,
  updateApiPermission,
  createRole,
  updateRole,
  deleteRole,
  saveRoleMenu,
  saveRoleApiPermissions,
} from "@/api/system";
import {
  type Ref,
  computed,
  reactive,
  ref,
  onMounted,
  h,
  toRaw,
  watch,
} from "vue";

type ApiPermissionItem = {
  id: number;
  code: string;
  name: string;
  module: string;
  method: string;
  path: string;
  description?: string | null;
  sort?: number | null;
  status?: number | null;
};

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
  const checkedApiPermissionIds = ref<number[]>([]);
  const apiPermissionData = ref<ApiPermissionItem[]>([]);
  const apiPermissionForm = reactive({
    id: 0,
    code: "",
    name: "",
    module: "",
    method: "GET",
    path: "",
    description: "",
    sort: 0,
    status: 1,
  });
  const activePermissionTab = ref("menu");
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();
  const switchLoadMap = ref({});
  const isExpandAll = ref(false);
  const isSelectAll = ref(false);
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

  /** 菜单权限 */
  async function handleMenu(row?: { id?: number; name?: string }) {
    const { id } = row ?? {};
    if (id) {
      curRow.value = row;
      isShow.value = true;
      activePermissionTab.value = "menu";
      const [{ code, data }, apiResult] = await Promise.all([
        getRolePermissions({ id }),
        listApiPermissions(),
      ]);
      if (code === 0 && data) {
        treeRef.value.setCheckedKeys(data.menuIds);
        checkedMenuIds.value = data.menuIds;
        checkedApiPermissionIds.value = data.apiPermissionIds;
        homePageId.value = data.homePageId;
      }
      if (apiResult.code === 0 && Array.isArray(apiResult.data)) {
        apiPermissionData.value = apiResult.data;
      }
    } else {
      curRow.value = null;
      isShow.value = false;
      checkedMenuIds.value = [];
      checkedApiPermissionIds.value = [];
      homePageId.value = null;
    }
  }

  function toggleApiPermission(id: number) {
    checkedApiPermissionIds.value = checkedApiPermissionIds.value.includes(id)
      ? checkedApiPermissionIds.value.filter((value) => value !== id)
      : [...checkedApiPermissionIds.value, id];
  }

  function handleTreeCheck(_node, { checkedKeys }) {
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
    const { id, name } = curRow.value;
    const menuIds = treeRef.value.getCheckedKeys() as number[];
    const { code: menuCode, message: menuMessage } = await saveRoleMenu({
      id,
      menuIds,
      homePageId: homePageId.value,
    });
    if (menuCode !== 0) {
      message(menuMessage || "菜单权限保存失败", { type: "error" });
      return;
    }

    const { code, message: msg } = await saveRoleApiPermissions({
      id,
      apiPermissionIds: checkedApiPermissionIds.value,
    });
    if (code === 0) {
      message(`角色 ${name} 的权限修改成功`, { type: "success" });
    } else {
      message(msg || "接口权限保存失败", { type: "error" });
    }
  }

  /** 数据权限 可自行开发 */
  // function handleDatabase() {}

  const onQueryChanged = (query: string) => {
    treeRef.value!.filter(query);
  };

  const filterMethod = (query: string, node) => {
    return transformI18n(node.title)!.includes(query);
  };

  onMounted(async () => {
    onSearch();
    const { code, data } = await getRoleMenu();
    if (code === 0 && Array.isArray(data)) {
      treeIds.value = getKeyList(data, "id");
      treeData.value = handleTree(data);
      menuPages.value = data.filter(
        (item: RoleMenuItem) =>
          item.menuType === 0 &&
          item.status === 1 &&
          item.path &&
          item.path !== "/" &&
          item.component,
      );
    }
  });

  watch(isExpandAll, (val) => {
    val
      ? treeRef.value.setExpandedKeys(treeIds.value)
      : treeRef.value.setExpandedKeys([]);
  });

  watch(isSelectAll, (val) => {
    const checkedKeys = val ? treeIds.value : [];
    treeRef.value.setCheckedKeys(checkedKeys);
    checkedMenuIds.value = checkedKeys;
    if (!val) homePageId.value = null;
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
    checkedApiPermissionIds,
    apiPermissionData,
    apiPermissionForm,
    toggleApiPermission,
    activePermissionTab,
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

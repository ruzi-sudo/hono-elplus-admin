<script setup lang="ts">
import { useRole } from "./utils/hook";
import { ref, computed, nextTick, onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  delay,
  subBefore,
  deviceDetection,
  useResizeObserver,
} from "@pureadmin/utils";

// import Database from "~icons/ri/database-2-line";
// import More from "~icons/ep/more-filled";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import Refresh from "~icons/ep/refresh";
import Menu from "~icons/ep/menu";
import AddFill from "~icons/ri/add-circle-line";
import Close from "~icons/ep/close";
import Check from "~icons/ep/check";

defineOptions({
  name: "SystemRole",
});

const iconClass = computed(() => {
  return [
    "size-5.5",
    "flex-c",
    "outline-hidden",
    "rounded-sm",
    "cursor-pointer",
    "transition-colors",
    "hover:bg-[#0000000f]",
    "dark:hover:bg-[#ffffff1f]",
    "dark:hover:text-[#ffffffd9]",
  ];
});

const treeRef = ref();
const formRef = ref();
const tableRef = ref();
const contentRef = ref();
const treeHeight = ref();

const {
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
} = useRole(treeRef);

onMounted(() => {
  useResizeObserver(contentRef, async () => {
    await nextTick();
    delay(60).then(() => {
      if (!tableRef.value) return;
      treeHeight.value = parseFloat(
        subBefore(
          tableRef.value.getTableDoms().tableWrapper.style.height,
          "px",
        ),
      );
    });
  });
});
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-full pl-8 pt-3 overflow-auto"
    >
      <el-form-item label="角色名称：" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入角色名称"
          clearable
          class="w-45!"
        />
      </el-form-item>
      <el-form-item label="角色标识：" prop="code">
        <el-select
          v-model="form.code"
          placeholder="请选择角色标识"
          clearable
          multiple
          collapse-tags
          class="w-45!"
        >
          <el-option label="admin" value="admin" />
          <el-option label="common" value="common" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请选择状态"
          clearable
          class="w-45!"
        >
          <el-option label="已启用" value="1" />
          <el-option label="已停用" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon('ri/search-line')"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <div
      ref="contentRef"
      :class="['flex', deviceDetection() ? 'flex-wrap' : '']"
    >
      <PureTableBar
        :class="[isShow && !deviceDetection() ? 'w-[60vw]!' : 'w-full']"
        style="transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1)"
        title="角色管理"
        :columns="columns"
        @refresh="onSearch"
      >
        <template #buttons>
          <Auth value="system-role:add">
            <el-button
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="openDialog()"
            >
              新增角色
            </el-button>
          </Auth>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            ref="tableRef"
            align-whole="center"
            showOverflowTooltip
            table-layout="auto"
            :loading="loading"
            :size="size"
            adaptive
            :row-style="rowStyle"
            :adaptiveConfig="{ offsetBottom: 108 }"
            :data="dataList"
            :columns="dynamicColumns"
            :pagination="{ ...pagination, size }"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)',
            }"
            @page-size-change="handleSizeChange"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <Auth value="system-role:edit">
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :size="size"
                  :icon="useRenderIcon(EditPen)"
                  :disabled="row.code === 'admin' || row.code === 'common'"
                  @click="openDialog('修改', row)"
                >
                  修改
                </el-button>
              </Auth>
              <Auth value="system-role:delete">
                <el-popconfirm
                  :title="`是否确认删除角色名称为${row.name}的这条数据`"
                  @confirm="handleDelete(row)"
                >
                  <template #reference>
                    <el-button
                      class="reset-margin"
                      link
                      type="primary"
                      :size="size"
                      :disabled="row.code === 'admin' || row.code === 'common'"
                      :icon="useRenderIcon(Delete)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-popconfirm>
              </Auth>
              <Auth value="system-role:configure-permission">
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :size="size"
                  :icon="useRenderIcon(Menu)"
                  @click="handleMenu(row)"
                >
                  权限
                </el-button>
              </Auth>
              <!-- <el-dropdown>
              <el-button
                class="ml-3 mt-[2px]"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(More)"
              />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>
                    <el-button
                      :class="buttonClass"
                      link
                      type="primary"
                      :size="size"
                      :icon="useRenderIcon(Menu)"
                      @click="handleMenu"
                    >
                      菜单权限
                    </el-button>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <el-button
                      :class="buttonClass"
                      link
                      type="primary"
                      :size="size"
                      :icon="useRenderIcon(Database)"
                      @click="handleDatabase"
                    >
                      数据权限
                    </el-button>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown> -->
            </template>
          </pure-table>
        </template>
      </PureTableBar>

      <div
        v-if="isShow"
        class="min-w-[calc(100vw-60vw-268px)]! w-full mt-2 px-2 pb-2 bg-bg_color ml-2 overflow-auto"
      >
        <div class="flex justify-between w-full px-3 pt-5 pb-4">
          <div class="flex">
            <span :class="iconClass">
              <IconifyIconOffline
                v-tippy="{
                  content: '关闭',
                }"
                class="dark:text-white"
                width="18px"
                height="18px"
                :icon="Close"
                @click="handleMenu()"
              />
            </span>
            <Auth value="system-role:save-permission">
              <span :class="[iconClass, 'ml-2']">
                <IconifyIconOffline
                  v-tippy="{
                    content: '保存权限配置',
                  }"
                  class="dark:text-white"
                  width="18px"
                  height="18px"
                  :icon="Check"
                  @click="handleSave"
                />
              </span>
            </Auth>
          </div>
          <p class="font-bold truncate">
            权限配置（页面/按钮与接口分开保存）
            {{ `${curRow?.name ? `（${curRow.name}）` : ""}` }}
          </p>
        </div>
        <el-tabs v-model="activePermissionTab" stretch>
          <el-tab-pane label="页面与按钮权限" name="menu">
            <el-input
              v-model="treeSearchValue"
              placeholder="请输入菜单进行搜索"
              class="mb-1"
              clearable
              @input="onQueryChanged"
            />
            <div class="flex flex-wrap">
              <el-checkbox v-model="isExpandAll" label="展开/折叠" />
              <el-checkbox v-model="isSelectAll" label="全选/全不选" />
              <el-checkbox v-model="isLinkage" label="父子联动" />
            </div>
            <el-tree-v2
              ref="treeRef"
              show-checkbox
              :data="treeData"
              :props="treeProps"
              :height="treeHeight"
              :check-strictly="!isLinkage"
              :filter-method="filterMethod"
              @check="handleTreeCheck"
            >
              <template #default="{ node }">
                <span>{{ transformI18n(node.label) }}</span>
              </template>
            </el-tree-v2>
          </el-tab-pane>
          <el-tab-pane label="独立接口权限" name="api">
            <div class="flex gap-2 mb-2">
              <el-tag type="info">
                已选择 {{ checkedApiPermissionIds.length }} 项
              </el-tag>
            </div>
            <el-checkbox-group v-model="checkedApiPermissionIds">
              <div
                v-for="permission in apiPermissionData"
                :key="permission.id"
                class="flex items-center gap-2 py-2 border-b border-border"
              >
                <el-checkbox :value="permission.id">
                  {{ permission.name }}
                </el-checkbox>
                <el-tag size="small">{{ permission.method }}</el-tag>
                <span class="text-xs text-text_color_secondary">
                  {{ permission.path }}
                </span>
                <span class="text-xs text-text_color_secondary">
                  {{ permission.code }}
                </span>
              </div>
            </el-checkbox-group>
          </el-tab-pane>
          <el-tab-pane label="角色首页" name="home">
            <el-form label-position="top" class="pt-2">
              <el-form-item label="登录首页">
                <el-select
                  v-if="homePageOptions.length > 0"
                  v-model="homePageId"
                  class="w-full"
                  clearable
                  filterable
                  placeholder="请选择角色首页"
                >
                  <el-option
                    v-for="item in homePageOptions"
                    :key="item.id"
                    :label="transformI18n(item.title)"
                    :value="item.id"
                  >
                    <div class="flex-bc gap-3">
                      <span>{{ transformI18n(item.title) }}</span>
                      <span class="text-xs text-text_color_disabled truncate">
                        {{ item.path }}
                      </span>
                    </div>
                  </el-option>
                </el-select>
                <el-empty
                  v-else
                  class="w-full py-6"
                  description="暂无可用页面"
                  :image-size="72"
                />
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.main-content {
  margin: 24px 24px 0 !important;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>

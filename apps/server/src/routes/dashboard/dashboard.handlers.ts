import { OpenAPIHono } from "@hono/zod-openapi";
import { faker } from "@faker-js/faker/locale/zh_CN";
import { getAuthenticatedUser } from "../../middlewares/auth";
import { validatorParamsHook } from "../../common/validator";
import * as routes from "./dashboard.routes";
import * as dashboardService from "../../service/dashboard.service";
import * as userService from "../../service/user.service";
import * as authService from "../../service/auth.service";
import { saveAvatar } from "../../service/upload.service";

export const route = new OpenAPIHono({
  defaultHook: (result, c) => validatorParamsHook(result, c),
});

const cardList = Array.from({ length: 48 }, (_, i) => ({
  index: i + 1,
  isSetup: [true, false][i % 2],
  type: (i % 5) + 1,
  banner: [
    "https://tdesign.gtimg.com/tdesign-pro/cloud-server.jpg",
    "https://tdesign.gtimg.com/tdesign-pro/t-sec.jpg",
    "https://tdesign.gtimg.com/tdesign-pro/ssl.jpg",
    "https://tdesign.gtimg.com/tdesign-pro/face-recognition.jpg",
    "https://tdesign.gtimg.com/tdesign-pro/cloud-db.jpg",
  ][i % 5],
  name: ["SSL证书", "人脸识别", "CVM", "云数据库", "T-Sec 云防火墙"][i % 5],
  description: "SSL证书又叫服务器证书，腾讯云为您提供证书的一站式服务",
}));

function generateMapList() {
  return Array.from({ length: 200 }, () => ({
    plateNumber: `豫A${String(Math.floor(Math.random() * 90000) + 10000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
    driver: faker.person.firstName(),
    orientation: Math.floor(Math.random() * 360) + 1,
    lng: 113 + Math.random() * 1.1,
    lat: 34 + Math.random() * 1.1,
  }));
}

route.openapi(routes.getCardList, async (c) => {
  return c.json({ code: 0, message: "操作成功", data: { list: cardList } });
});

route.openapi(routes.getMapInfo, async (c) => {
  return c.json({ code: 0, message: "操作成功", data: generateMapList() });
});

route.openapi(routes.getMine, async (c) => {
  const user = getAuthenticatedUser(c);
  const data = await dashboardService.getMineInfo(user.userId);
  return c.json({ code: 0, message: "操作成功", data: data || {} });
});

route.openapi(routes.updateMine, async (c) => {
  const user = getAuthenticatedUser(c);
  const body = c.req.valid("json");
  try {
    await userService.updateUser({
      id: user.userId,
      username: body.username,
      avatar: body.avatar,
      email: body.email,
      remark: body.remark,
    });
    return c.json({ code: 0, message: "操作成功", data: {} });
  } catch (error: any) {
    return c.json(
      {
        code: error.code || 10001,
        message: error.message || "修改失败",
        data: {},
      },
      error.status || 400,
    );
  }
});

route.openapi(routes.resetMinePassword, async (c) => {
  const user = getAuthenticatedUser(c);
  const body = c.req.valid("json");
  try {
    await authService.changeOwnPassword(
      user.userId,
      body.currentPassword,
      body.password,
    );
    return c.json({ code: 0, message: "操作成功", data: {} });
  } catch (error: any) {
    return c.json(
      {
        code: error.code || 10001,
        message: error.message || "更新密码失败",
        data: {},
      },
      error.status || 400,
    );
  }
});

route.openapi(routes.uploadMineAvatar, async (c) => {
  const { file } = c.req.valid("form");
  const url = await saveAvatar(file);
  return c.json({ code: 0, message: "操作成功", data: { url } });
});

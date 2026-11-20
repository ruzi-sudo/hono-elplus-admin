import { z } from "@hono/zod-openapi";

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.coerce.number().optional(),
);

export const ListUsersQuerySchema = z.object({
  username: z.string().optional().openapi({ example: "admin" }),
  status: optionalNumber.openapi({ example: 1 }),
  email: z
    .string()
    .optional()
    .nullable()
    .openapi({ example: "admin@pureadmin.cn" }),
  pageNum: z.coerce.number().positive().int().default(1),
  pageSize: z.coerce.number().positive().int().default(10),
});

export const UploadAvatarSchema = z.object({
  file: z
    .custom<File>((value) => value instanceof File, "请上传头像文件")
    .openapi({ type: "string", format: "binary" }),
});

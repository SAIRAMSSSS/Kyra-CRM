import { prisma } from "./prisma";
import { UserRole } from "./rbac";

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        linkUrl: params.linkUrl || null,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

export async function notifyUsersWithRole(
  role: UserRole,
  params: Omit<CreateNotificationParams, "userId">
) {
  try {
    const users = await prisma.user.findMany({
      where: { role, status: "ACTIVE" },
      select: { id: true },
    });

    for (const u of users) {
      await createNotification({ ...params, userId: u.id });
    }
  } catch (err) {
    console.error("Failed to notify role:", role, err);
  }
}

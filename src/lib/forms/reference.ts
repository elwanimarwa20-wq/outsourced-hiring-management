import { prisma } from "@/lib/db";

export async function getEntities() {
  return prisma.entity.findMany({ where: { isActive: true }, orderBy: { code: "asc" } });
}

export async function getNationalities() {
  return prisma.nationality.findMany({ orderBy: { nameEn: "asc" } });
}

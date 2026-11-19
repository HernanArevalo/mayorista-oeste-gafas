import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getStoreConfig = cache(async () =>
  prisma.storeConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  })
);

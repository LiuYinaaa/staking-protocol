import { Prisma } from "@prisma/client";

export function decimalToBigInt(value: Prisma.Decimal | null | undefined): bigint {
  if (!value) return 0n;

  // Use fixed-point conversion to avoid scientific notation (e.g. "7.5e+22")
  // that cannot be parsed directly by BigInt.
  return BigInt(value.toFixed(0));
}


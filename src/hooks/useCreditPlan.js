// src/hooks/useCreditPlan.js
import { useMemo } from "react";
import { calculateCreditPlan } from "../finance/creditEngine";  // ✅ @/ → ../

export function useCreditPlan(product) {
  const creditPlan = useMemo(() => {
    if (!product) return null;

    return calculateCreditPlan({
      price: product.precio  // ✅ product.price → product.precio
    });
  }, [product]);

  return creditPlan;
}
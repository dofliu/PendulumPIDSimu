import { ComplexRoot } from '../types';

// Helper for complex number arithmetic if needed, though Math.cbrt handles real cube roots.
// For simplicity, this implementation will focus on common cases.

export function solveQuadratic(a: number, b: number, c: number): ComplexRoot[] {
  if (a === 0) { // Linear equation bx + c = 0
    if (b === 0) return []; // Or handle as error/infinite solutions
    return [{ real: -c / b, imag: 0 }];
  }

  const discriminant = b * b - 4 * a * c;
  if (discriminant >= 0) {
    const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    return [
      { real: root1, imag: 0 },
      { real: root2, imag: 0 },
    ];
  } else {
    const realPart = -b / (2 * a);
    const imagPart = Math.sqrt(-discriminant) / (2 * a);
    return [
      { real: realPart, imag: imagPart },
      { real: realPart, imag: -imagPart },
    ];
  }
}

// Solves ax^3 + bx^2 + cx + d = 0
// Using Cardano's method (simplified for real coefficients leading to at least one real root)
export function solveCubic(a: number, b: number, c: number, d: number): ComplexRoot[] {
  if (a === 0) {
    return solveQuadratic(b, c, d);
  }

  // Normalize to x^3 + p_x^2 + q_x + r_ = 0
  const p_ = b / a;
  const q_ = c / a;
  const r_ = d / a;

  // Substitute x = y - p_/3 to get y^3 + py + q = 0
  const p = (3 * q_ - p_ * p_) / 3;
  const q = (2 * p_ * p_ * p_ - 9 * p_ * q_ + 27 * r_) / 27;

  const roots: ComplexRoot[] = [];

  if (p === 0) { // y^3 + q = 0 => y^3 = -q
    const y0 = Math.cbrt(-q);
    roots.push({ real: y0, imag: 0 });
    // Other roots (complex if -q is not 0)
    const y1_real = y0 * (-0.5);
    const y1_imag = y0 * (Math.sqrt(3) / 2);
    roots.push({ real: y1_real, imag: y1_imag });
    roots.push({ real: y1_real, imag: -y1_imag });

  } else {
      const discriminant_cubic = (q / 2) * (q / 2) + (p / 3) * (p / 3) * (p / 3);

      if (discriminant_cubic >= 0) {
          const u_cubed = -q / 2 + Math.sqrt(discriminant_cubic);
          const v_cubed = -q / 2 - Math.sqrt(discriminant_cubic);
          const u = Math.cbrt(u_cubed);
          const v = Math.cbrt(v_cubed);
          
          const y0 = u + v;
          roots.push({ real: y0, imag: 0 });

          const y1_real = -0.5 * (u + v);
          const y1_imag = 0.5 * Math.sqrt(3) * (u - v);
          roots.push({ real: y1_real, imag: y1_imag });
          roots.push({ real: y1_real, imag: -y1_imag });

      } else { // Three distinct real roots
          const r_cardano = Math.sqrt(-p*p*p / 27);
          const phi_cardano = Math.acos(-q / (2 * r_cardano));
          
          const y0 = 2 * Math.cbrt(r_cardano) * Math.cos(phi_cardano / 3);
          const y1 = 2 * Math.cbrt(r_cardano) * Math.cos((phi_cardano + 2 * Math.PI) / 3);
          const y2 = 2 * Math.cbrt(r_cardano) * Math.cos((phi_cardano + 4 * Math.PI) / 3);
          roots.push({real: y0, imag: 0});
          roots.push({real: y1, imag: 0});
          roots.push({real: y2, imag: 0});
      }
  }
  
  // Transform back: x = y - p_/3
  return roots.map(root => ({
    real: root.real - p_ / 3,
    imag: root.imag,
  })).sort((ra, rb) => ra.real - rb.real || ra.imag - rb.imag); // Sort for consistent display
}

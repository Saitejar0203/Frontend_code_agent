import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

const mathContent = `
# Mathematical Expressions Demo

## Basic Math

Inline math: The famous equation $E = mc^2$ shows the mass-energy equivalence.

Another example: The area of a circle is $A = \pi r^2$.

## Block Math

### Quadratic Formula
The solution to $ax^2 + bx + c = 0$ is:
$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

### Euler's Identity
One of the most beautiful equations in mathematics:
$$e^{i\pi} + 1 = 0$$

### Calculus
The fundamental theorem of calculus:
$$\int_a^b f'(x) dx = f(b) - f(a)$$

Derivative of exponential function:
$$\frac{d}{dx}e^x = e^x$$

### Linear Algebra
Matrix multiplication:
$$\begin{pmatrix} a & b \\\\ c & d \end{pmatrix} \begin{pmatrix} x \\\\ y \end{pmatrix} = \begin{pmatrix} ax + by \\\\ cx + dy \end{pmatrix}$$

### Statistics
Normal distribution probability density function:
$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$$

### Physics
Schrödinger equation:
$$i\hbar\frac{\partial}{\partial t}\Psi(\mathbf{r},t) = \hat{H}\Psi(\mathbf{r},t)$$

Maxwell's equations:
$$\nabla \cdot \mathbf{E} = \frac{\rho}{\epsilon_0}$$
$$\nabla \cdot \mathbf{B} = 0$$
$$\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}$$
$$\nabla \times \mathbf{B} = \mu_0\mathbf{J} + \mu_0\epsilon_0\frac{\partial \mathbf{E}}{\partial t}$$

## Greek Letters and Symbols

Greek letters: $\alpha$, $\beta$, $\gamma$, $\delta$, $\epsilon$, $\zeta$, $\eta$, $\theta$, $\iota$, $\kappa$, $\lambda$, $\mu$, $\nu$, $\xi$, $\pi$, $\rho$, $\sigma$, $\tau$, $\upsilon$, $\phi$, $\chi$, $\psi$, $\omega$

Capital Greek letters: $\Gamma$, $\Delta$, $\Theta$, $\Lambda$, $\Xi$, $\Pi$, $\Sigma$, $\Upsilon$, $\Phi$, $\Psi$, $\Omega$

Math operators: $\sum$, $\prod$, $\int$, $\oint$, $\nabla$, $\partial$, $\infty$, $\pm$, $\mp$, $\times$, $\div$, $\cdot$

Relations: $\leq$, $\geq$, $\neq$, $\approx$, $\equiv$, $\propto$, $\sim$, $\simeq$, $\cong$

Arrows: $\rightarrow$, $\leftarrow$, $\leftrightarrow$, $\Rightarrow$, $\Leftarrow$, $\Leftrightarrow$, $\uparrow$, $\downarrow$

## Complex Expressions

### Fourier Transform
$$\mathcal{F}\{f(t)\} = F(\omega) = \int_{-\infty}^{\infty} f(t) e^{-i\omega t} dt$$

### Taylor Series
$$f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n$$

### Binomial Theorem
$$(x + y)^n = \sum_{k=0}^{n} \binom{n}{k} x^{n-k} y^k$$

where $\binom{n}{k} = \frac{n!}{k!(n-k)!}$

## Code with Math

You can also combine code blocks with mathematical expressions:

\`\`\`python
import numpy as np
import matplotlib.pyplot as plt

# Plot the function f(x) = x^2
x = np.linspace(-5, 5, 100)
y = x**2

plt.plot(x, y)
plt.title('Graph of $f(x) = x^2$')
plt.xlabel('$x$')
plt.ylabel('$f(x)$')
plt.show()
\`\`\`

The function $f(x) = x^2$ has derivative $f'(x) = 2x$ and integral $\int x^2 dx = \frac{x^3}{3} + C$.
`;

export const MathExample: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <MarkdownRenderer
        content={mathContent}
        theme="documentation"
        enableMath={true}
        enableCopy={true}
        enableGfm={true}
        enableHighlight={true}
      />
    </div>
  );
};

export default MathExample;
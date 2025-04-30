# Testing Strategy

A comprehensive testing strategy is essential for ensuring the reliability and stability of the BrightBroom application. This document outlines our approach to testing at various levels.

## Testing Levels

### 1. Unit Testing

Unit tests focus on verifying the behavior of individual functions and components in isolation.

**Framework**: Vitest (included with SvelteKit)

**Key Areas to Test**:

- Utility functions
- Service functions
- Validation logic
- State management
- Form handling helpers

**Example Unit Test**:

```typescript
// src/lib/utils/dateUtils.test.ts
import { describe, it, expect } from "vitest";
import { isValidBookingDate, formatBookingTime } from "./dateUtils";

describe("Date Utilities", () => {
  describe("isValidBookingDate", () => {
    it("should return false for dates in the past", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isValidBookingDate(pastDate)).toBe(false);
    });

    it("should return true for dates in the future", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isValidBookingDate(futureDate)).toBe(true);
    });

    it("should return false for dates more than 3 months in the future", () => {
      const farFutureDate = new Date();
      farFutureDate.setMonth(farFutureDate.getMonth() + 4);
      expect(isValidBookingDate(farFutureDate)).toBe(false);
    });
  });

  describe("formatBookingTime", () => {
    it("should format time correctly", () => {
      const date = new Date(2023, 0, 1, 14, 30);
      expect(formatBookingTime(date)).toBe("2:30 PM");
    });
  });
});
```

### 2. Component Testing

Component tests verify that UI components render correctly and handle user interactions as expected.

**Framework**: Vitest + Testing Library for Svelte

**Key Areas to Test**:

- UI component rendering
- Component props and slots
- User interactions (clicks, inputs, etc.)
- Accessibility
- Component state changes

**Example Component Test**:

```typescript
// src/lib/components/ui/Button.test.ts
import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import Button from "./Button.svelte";

describe("Button Component", () => {
  it("renders with default props", () => {
    const { getByRole } = render(Button, { props: { label: "Click Me" } });
    const button = getByRole("button");

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Click Me");
    expect(button).toHaveClass("bg-primary");
  });

  it("applies variant classes correctly", () => {
    const { getByRole } = render(Button, {
      props: { label: "Secondary", variant: "secondary" },
    });

    const button = getByRole("button");
    expect(button).toHaveClass("bg-secondary");
    expect(button).not.toHaveClass("bg-primary");
  });

  it("handles click events", async () => {
    let clicked = false;
    const { getByRole } = render(Button, {
      props: {
        label: "Click Me",
        onClick: () => {
          clicked = true;
        },
      },
    });

    const button = getByRole("button");
    await fireEvent.click(button);

    expect(clicked).toBe(true);
  });

  it("shows loading state", () => {
    const { getByRole, getByTestId } = render(Button, {
      props: { label: "Loading", loading: true },
    });

    expect(getByTestId("loading-spinner")).toBeInTheDocument();
    expect(getByRole("button")).toBeDisabled();
  });
});
```

### 3. Integration Testing

Integration tests verify that multiple components or systems work correctly together.

**Framework**: Vitest + SvelteKit Testing Utilities

**Key Areas to Test**:

- Form submissions
- Data fetching
- Page navigation
- Authentication flows
- Booking process

**Example Integration Test**:

```typescript
// src/routes/book/+page.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { goto } from "$app/navigation";
import BookingPage from "./+page.svelte";

// Mock dependencies
vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
}));

vi.mock("$lib/server/booking", () => ({
  getAvailableServices: vi.fn().mockResolvedValue([
    { id: "1", name: "Regular Cleaning", price: 350, duration: 6 },
    { id: "2", name: "Extended Cleaning", price: 500, duration: 10 },
  ]),
}));

describe("Booking Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders available services", async () => {
    render(BookingPage);

    await waitFor(() => {
      expect(screen.getByText("Regular Cleaning")).toBeInTheDocument();
      expect(screen.getByText("Extended Cleaning")).toBeInTheDocument();
    });
  });

  it("enables the continue button when a service is selected", async () => {
    render(BookingPage);

    const continueButton = screen.getByText("Continue");
    expect(continueButton).toBeDisabled();

    await waitFor(() => {
      const regularCleaningOption = screen.getByText("Regular Cleaning");
      fireEvent.click(regularCleaningOption);
    });

    expect(continueButton).not.toBeDisabled();
  });

  it("navigates to address selection on continue", async () => {
    render(BookingPage);

    await waitFor(() => {
      const regularCleaningOption = screen.getByText("Regular Cleaning");
      fireEvent.click(regularCleaningOption);
    });

    const continueButton = screen.getByText("Continue");
    await fireEvent.click(continueButton);

    expect(goto).toHaveBeenCalledWith("/book/address");
  });
});
```

### 4. End-to-End Testing

E2E tests verify that complete user flows work correctly from start to finish.

**Framework**: Playwright

**Key Areas to Test**:

- Critical user journeys
- Cross-browser compatibility
- Complete booking flow
- Authentication and account management
- Payment process (using test mode)

**Example E2E Test**:

```typescript
// tests/e2e/booking-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Log in
    await page.goto("/auth/login");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Navigate to booking page
    await page.goto("/book");
  });

  test("complete booking process", async ({ page }) => {
    // Step 1: Select service
    await page.click("text=Regular Cleaning");
    await page.click("text=Continue");

    // Step 2: Select address
    await page.click("text=123 Main St, Cape Town");
    await page.click("text=Continue");

    // Step 3: Select date and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split("T")[0];

    await page.fill('input[type="date"]', dateString);
    await page.click("text=10:00");
    await page.click("text=Continue");

    // Step 4: Review and confirm
    await expect(page.locator("text=Regular Cleaning")).toBeVisible();
    await expect(page.locator("text=123 Main St")).toBeVisible();
    await expect(page.locator(`text=${dateString}`)).toBeVisible();
    await expect(page.locator("text=10:00")).toBeVisible();

    await page.click("text=Confirm & Pay");

    // Step 5: Payment (using test mode)
    await expect(page).toHaveURL(/payment/);

    // Mock successful payment response
    await page.route("**/api/payments/process", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          redirectUrl: "/payment/success?booking_id=test123",
        }),
      });
    });

    await page.click("text=Pay Now");

    // Check confirmation page
    await expect(page).toHaveURL(/payment\/success/);
    await expect(page.locator("text=Booking Confirmed")).toBeVisible();
  });
});
```

## API Testing

API endpoints are tested to ensure correct behavior and response formats.

**Framework**: Vitest + Supertest

**Key Areas to Test**:

- API response formats
- Error handling
- Authentication and authorization
- Business logic
- Edge cases

**Example API Test**:

```typescript
// src/routes/api/bookings/+server.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./+server";
import { prisma } from "$lib/server/prisma";

// Mock Prisma client
vi.mock("$lib/server/prisma", () => ({
  prisma: {
    booking: {
      create: vi.fn(),
    },
    service: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock authentication
vi.mock("$lib/server/auth", () => ({
  auth: {
    validateRequest: vi.fn().mockResolvedValue({
      user: { id: "user123", email: "test@example.com" },
    }),
  },
}));

describe("Bookings API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new booking", async () => {
    // Mock service lookup
    prisma.service.findUnique.mockResolvedValue({
      id: "service123",
      name: "Regular Cleaning",
      price: 350,
      durationHours: 6,
    });

    // Mock booking creation
    prisma.booking.create.mockResolvedValue({
      id: "booking123",
      userId: "user123",
      serviceId: "service123",
      addressId: "address123",
      scheduledDate: new Date("2023-12-01T10:00:00Z"),
      status: "PENDING",
      price: 350,
    });

    const request = new Request("http://localhost/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceId: "service123",
        addressId: "address123",
        scheduledDate: "2023-12-01T10:00:00Z",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("id", "booking123");
    expect(data).toHaveProperty("status", "PENDING");
    expect(prisma.booking.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user123",
        serviceId: "service123",
        addressId: "address123",
      }),
    });
  });

  it("returns 400 for invalid input", async () => {
    const request = new Request("http://localhost/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Missing required fields
        serviceId: "service123",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(prisma.booking.create).not.toHaveBeenCalled();
  });
});
```

## Test Coverage Goals

- **Unit Tests**: 80% coverage of utility functions and services
- **Component Tests**: All UI components should have basic rendering tests
- **Integration Tests**: Cover all main features and user flows
- **E2E Tests**: Cover critical user journeys and payment flows

## Continuous Integration

Tests will be run as part of the CI/CD pipeline:

1. **Pull Request Checks**: Run unit and component tests
2. **Staging Deployment**: Run integration and E2E tests
3. **Production Deployment**: Run smoke tests to verify critical features

## Performance Testing

Performance testing will ensure the application meets responsiveness requirements:

1. **Lighthouse Scores**: Maintain good performance, accessibility, SEO, and best practices scores
2. **Load Testing**: Simulate concurrent users for booking and payment processes
3. **API Response Times**: Monitor and optimize slow endpoints

## Testing Tools Integration

- **Code Coverage**: Vitest with Istanbul
- **Visual Regression**: Percy or Chromatic
- **Accessibility Testing**: Playwright Accessibility tests and axe-core
- **Mocking**: MSW (Mock Service Worker) for API mocking

## Test Environment Strategy

1. **Local Development**: Unit and component tests using local setup
2. **CI/CD Pipeline**: All test levels with ephemeral test databases
3. **Staging Environment**: Integration and E2E tests against staging APIs
4. **Test Data Management**: Use factories and fixtures for consistent test data

## Test-Driven Development Approach

1. Write failing tests first
2. Implement the minimal code to pass tests
3. Refactor while maintaining passing tests
4. Repeat for new features

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoutesStub } from "react-router";
import MainApp from "#/routes/root-layout";
import OptionService from "#/api/option-service/option-service.api";
import AuthService from "#/api/auth-service/auth-service.api";
import SettingsService from "#/api/settings-service/settings-service.api";
import { MOCK_DEFAULT_USER_SETTINGS } from "#/mocks/handlers";

vi.mock("#/hooks/use-github-auth-url", () => ({
  useGitHubAuthUrl: () => "https://github.com/oauth/authorize",
}));

vi.mock("#/hooks/use-is-on-tos-page", () => ({
  useIsOnTosPage: () => false,
}));

vi.mock("#/hooks/use-auto-login", () => ({
  useAutoLogin: () => {},
}));

vi.mock("#/hooks/use-auth-callback", () => ({
  useAuthCallback: () => {},
}));

vi.mock("#/hooks/use-migrate-user-consent", () => ({
  useMigrateUserConsent: () => ({
    migrateUserConsent: vi.fn(),
  }),
}));

vi.mock("#/hooks/use-reo-tracking", () => ({
  useReoTracking: () => {},
}));

vi.mock("#/hooks/use-sync-posthog-consent", () => ({
  useSyncPostHogConsent: () => {},
}));

vi.mock("#/utils/custom-toast-handlers", () => ({
  displaySuccessToast: vi.fn(),
}));

const RouterStub = createRoutesStub([
  {
    Component: MainApp,
    path: "/",
    children: [
      {
        Component: () => <div data-testid="outlet-content" />,
        path: "/",
      },
    ],
  },
]);

const RouterStubWithLogin = createRoutesStub([
  {
    Component: MainApp,
    path: "/",
    children: [
      {
        Component: () => <div data-testid="outlet-content" />,
        path: "/",
      },
      {
        Component: () => <div data-testid="settings-page" />,
        path: "/settings",
      },
    ],
  },
  {
    Component: () => <div data-testid="login-page" />,
    path: "/login",
  },
]);

const RouterStubWithLoginAndContent = createRoutesStub([
  {
    Component: MainApp,
    path: "/",
    children: [
      {
        Component: () => <div data-testid="outlet-content" />,
        path: "/",
      },
    ],
  },
  {
    Component: () => (
      <div data-testid="login-page">
        <div data-testid="login-content">
          <div data-testid="email-verified-message" />
        </div>
      </div>
    ),
    path: "/login",
  },
]);

const RouterStubWithLoginWithoutMessage = createRoutesStub([
  {
    Component: MainApp,
    path: "/",
    children: [
      {
        Component: () => <div data-testid="outlet-content" />,
        path: "/",
      },
    ],
  },
  {
    Component: () => (
      <div data-testid="login-page">
        <div data-testid="login-content" />
      </div>
    ),
    path: "/login",
  },
]);

const renderMainApp = (initialEntries: string[] = ["/"]) =>
  render(<RouterStub initialEntries={initialEntries} />, {
    wrapper: ({ children }) => (
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        {children}
      </QueryClientProvider>
    ),
  });

const renderWithLoginStub = (
  RouterStubComponent: ReturnType<typeof createRoutesStub>,
  initialEntries: string[] = ["/"],
) =>
  render(<RouterStubComponent initialEntries={initialEntries} />, {
    wrapper: ({ children }) => (
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        {children}
      </QueryClientProvider>
    ),
  });

describe("MainApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(OptionService, "getConfig").mockResolvedValue({
      APP_MODE: "saas",
      GITHUB_CLIENT_ID: "test-client-id",
      POSTHOG_CLIENT_KEY: "test-posthog-key",
      PROVIDERS_CONFIGURED: ["github"],
      AUTH_URL: "https://auth.example.com",
      FEATURE_FLAGS: {
        ENABLE_BILLING: false,
        HIDE_LLM_SETTINGS: false,
        ENABLE_JIRA: false,
        ENABLE_JIRA_DC: false,
        ENABLE_LINEAR: false,
      },
    });

    vi.spyOn(AuthService, "authenticate").mockResolvedValue(true);

    vi.spyOn(SettingsService, "getSettings").mockResolvedValue(
      MOCK_DEFAULT_USER_SETTINGS,
    );

    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Email Verification", () => {
    it("should display EmailVerificationModal when email_verification_required=true is in query params", async () => {
      renderMainApp(["/?email_verification_required=true"]);

      await waitFor(() => {
        expect(
          screen.getByText("AUTH$PLEASE_CHECK_EMAIL_TO_VERIFY"),
        ).toBeInTheDocument();
      });
    });

    it("should set emailVerified state and pass to login page when email_verified=true is in query params", async () => {
      const axiosError = {
        response: { status: 401 },
        isAxiosError: true,
      };
      vi.spyOn(AuthService, "authenticate").mockRejectedValue(axiosError);

      renderWithLoginStub(RouterStubWithLoginAndContent, [
        "/?email_verified=true",
      ]);

      await waitFor(
        () => {
          expect(screen.getByTestId("login-page")).toBeInTheDocument();
          expect(
            screen.getByTestId("email-verified-message"),
          ).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it("should handle both email_verification_required and email_verified params together", async () => {
      renderMainApp(["/?email_verification_required=true&email_verified=true"]);

      await waitFor(() => {
        expect(
          screen.getByText("AUTH$PLEASE_CHECK_EMAIL_TO_VERIFY"),
        ).toBeInTheDocument();
      });
    });

    it("should remove query parameters from URL after processing", async () => {
      const { container } = renderMainApp([
        "/?email_verification_required=true",
      ]);

      await waitFor(() => {
        expect(
          screen.getByText("AUTH$PLEASE_CHECK_EMAIL_TO_VERIFY"),
        ).toBeInTheDocument();
      });

      expect(container).toBeInTheDocument();
    });

    it("should not display EmailVerificationModal when email_verification_required is not in query params", async () => {
      renderMainApp();

      await waitFor(() => {
        expect(
          screen.queryByText("AUTH$PLEASE_CHECK_EMAIL_TO_VERIFY"),
        ).not.toBeInTheDocument();
      });
    });

    it("should not display email verified message when email_verified is not in query params", async () => {
      const axiosError = {
        response: { status: 401 },
        isAxiosError: true,
      };
      vi.spyOn(AuthService, "authenticate").mockRejectedValue(axiosError);

      renderWithLoginStub(RouterStubWithLoginWithoutMessage);

      await waitFor(
        () => {
          expect(screen.getByTestId("login-page")).toBeInTheDocument();
          expect(
            screen.queryByTestId("email-verified-message"),
          ).not.toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe("Unauthenticated redirect", () => {
    beforeEach(() => {
      vi.spyOn(AuthService, "authenticate").mockRejectedValue({
        response: { status: 401 },
        isAxiosError: true,
      });
    });

    it("should redirect unauthenticated SaaS users to /login", async () => {
      renderWithLoginStub(RouterStubWithLogin, ["/"]);

      await waitFor(
        () => {
          expect(screen.getByTestId("login-page")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it("should redirect to /login with returnTo parameter when on a specific page", async () => {
      renderWithLoginStub(RouterStubWithLogin, ["/settings"]);

      await waitFor(
        () => {
          expect(screen.getByTestId("login-page")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });
});

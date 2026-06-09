import { Component, type ErrorInfo, type ReactNode } from "react";
import { ButtonLink } from "../ui/Button";

interface Props {
  children: ReactNode;
  homeTo?: string;
}

interface State {
  hasError: boolean;
}

export class WorkspaceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Workspace render error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-error/40 bg-error-container/30 p-lg text-center">
          <p className="font-headline-sm text-on-surface">Không tải được trang</p>
          <p className="mt-sm font-body-sm text-on-surface-variant">
            Đã xảy ra lỗi hiển thị. Thử tải lại hoặc quay về tổng quan.
          </p>
          <div className="mt-md flex flex-wrap justify-center gap-sm">
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 font-label-md text-on-primary"
              onClick={() => window.location.reload()}
            >
              Tải lại
            </button>
            <ButtonLink to={this.props.homeTo ?? "/events"} variant="secondary">
              Về tổng quan
            </ButtonLink>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

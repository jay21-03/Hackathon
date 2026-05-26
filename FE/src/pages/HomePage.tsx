import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPublicEvents } from "../services/eventsApi";

type LoadState = "loading" | "ok" | "error";

export function HomePage() {
  const [state, setState] = useState<LoadState>("loading");
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchPublicEvents()
      .then((events) => {
        if (!cancelled) {
          setEventCount(events.length);
          setState("ok");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="card">
      <h2>Trang chủ</h2>
      <p>Hệ thống quản lý SEAL Hackathon — FE gọi BE qua API REST.</p>

      {state === "loading" && (
        <p className="status loading">Đang kiểm tra kết nối backend...</p>
      )}

      {state === "ok" && (
        <p className="status ok">
          Backend hoạt động. Có <strong>{eventCount}</strong> sự kiện công
          khai.
        </p>
      )}

      {state === "error" && (
        <p className="status error">
          Không kết nối được backend. Chạy PostgreSQL + Spring Boot trong{" "}
          <code>BE/</code> (cổng 8085) rồi tải lại trang.
        </p>
      )}

      <p>
        <Link to="/events">Xem danh sách sự kiện →</Link>
      </p>
    </section>
  );
}

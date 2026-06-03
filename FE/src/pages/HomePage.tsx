import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <section className="card">
      <h2>Trang chu</h2>
      <p>He thong quan ly dang ky, cham diem va cong bo ket qua SEAL Hackathon.</p>
      <p>
        <Link to="/events">Xem danh sach cuoc thi</Link>
      </p>
    </section>
  );
}

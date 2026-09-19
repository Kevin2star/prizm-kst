import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Home.css";

function Home(){
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("로그인 실패:", error.message);
        alert("이메일 또는 비밀번호가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      const user = data.user;
      const nickname = user?.user_metadata?.nickname || "";

      sessionStorage.setItem("prizm_test_nickname", nickname);
      sessionStorage.setItem("prizm_test_email", user?.email || email.trim());

      setLoading(false);
      navigate("/main");
    } catch (error) {
      console.error("로그인 중 오류:", error);
      alert("로그인 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <header className="login-header">
        <Link to="/" className="prizm-logo">
          PRIZM
        </Link>

        <p>다른 생각이, 더 큰 가능성을 만듭니다.</p>
      </header>

      <div className="login-layout">
        {/* 왼쪽 서비스 소개 */}
        <section className="service-section">
          <p className="service-eyebrow">
            AI FOR A MORE CONNECTED TOMORROW
          </p>

          <h1 className="service-title">
            흩어진 결과물이
            <br />
            <span>하나의 연결</span>이 되는 순간
          </h1>

          <p className="service-description">
            서로 다른 학교와 전공의 결과물을 AI가 분석하고 연결해,
            <br />
            새로운 협업의 가능성을 보여줍니다.
          </p>

          <div className="service-content">
            <div className="feature-list">
              <article className="feature-card">
                <div className="feature-icon">↑</div>
                <h2>결과물 업로드</h2>
              </article>

              <article className="feature-card">
                <div className="feature-icon">AI</div>
                <h2>AI 자동 분석</h2>
              </article>

              <article className="feature-card">
                <div className="feature-icon network-icon">⌘</div>
                <h2>관계 지도 생성</h2>
              </article>
            </div>

            {/* 관계 지도 장식 */}
            <div className="relation-map" aria-hidden="true">
              <div className="map-line line-one" />
              <div className="map-line line-two" />
              <div className="map-line line-three" />
              <div className="map-line line-four" />

              <span className="map-node node-one" />
              <span className="map-node node-two" />
              <span className="map-node node-three" />
              <span className="map-node node-four" />
              <span className="map-node node-five" />

              <div className="map-center">PRIZM</div>

              <span className="map-tag tag-design">디자인</span>
              <span className="map-tag tag-engineering">공학</span>
              <span className="map-tag tag-business">경영</span>
              <span className="map-tag tag-art">예술</span>
            </div>
          </div>

          <div className="service-flow">
            <span>업로드</span>
            <b>→</b>
            <span>AI 분석</span>
            <b>→</b>
            <span>관계 발견</span>
            <b>→</b>
            <span>새로운 협업</span>
          </div>
        </section>

        {/* 오른쪽 로그인 */}
        <section className="login-panel">
          <div className="login-card">
            <h2>로그인</h2>

            <p className="login-description">
              각자의 결과물을 올리면, AI가 서로 다른
              <br />
              관점을 찾아 연결합니다.
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="login-email">이메일</label>

              <div className="login-input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <label htmlFor="login-password">비밀번호</label>

              <div className="login-input-wrapper">
                <span className="input-icon">♙</span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="비밀번호 표시 전환"
                >
                  {showPassword ? "숨김" : "보기"}
                </button>
              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? "로그인 중..." : "로그인 →"}
              </button>
            </form>

            <div className="login-divider">
              <span>또는</span>
            </div>

            <p className="signup-guide">
              아직 계정이 없나요?
              <Link to="/signup">회원가입</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Home;

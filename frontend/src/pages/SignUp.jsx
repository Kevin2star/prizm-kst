import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { validateEmail, validateNickname, validatePassword } from "../auth";
import "./SignUp.css";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const emailCheck = validateEmail(email);
    const nicknameCheck = validateNickname(nickname);
    const passwordCheck = validatePassword(password);

    if (!emailCheck.ok) {
      alert(emailCheck.message);
      return;
    }
    if (!nicknameCheck.ok) {
      alert(nicknameCheck.message);
      return;
    }
    if (!passwordCheck.ok) {
      alert(passwordCheck.message);
      return;
    }
    if (password !== passwordConfirm) {
      alert("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: emailCheck.email,
      password,
      options: {
        data: { nickname: nicknameCheck.nickname },
      },
    });

    setLoading(false);

    if (error) {
      alert(`회원가입 실패: ${error.message}`);
      return;
    }

    alert("인증 이메일을 보냈습니다. 이메일을 확인해주세요.");
    navigate("/");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-logo">
          PRIZM
        </Link>

        <h1>회원가입</h1>

        <p className="auth-description">
          이메일로 가입하고 새로운 협업을 시작하세요.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="signup-email">이메일</label>
          <input
            id="signup-email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="signup-nickname">닉네임</label>
          <input
            id="signup-nickname"
            type="text"
            placeholder="2자 이상 입력하세요"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            minLength="2"
            maxLength="80"
            autoComplete="nickname"
            required
          />

          <label htmlFor="signup-password">비밀번호</label>
          <input
            id="signup-password"
            type="password"
            placeholder="6자 이상 입력하세요"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength="6"
            autoComplete="new-password"
            required
          />

          <label htmlFor="password-confirm">비밀번호 확인</label>
          <input
            id="password-confirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            minLength="6"
            autoComplete="new-password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="auth-guide">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </section>
    </main>
  );
}

export default Signup;

import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="home">
      <p className="eyebrow">Prizm</p>
      <h1>각자 올리기만 하면, 정리는 알아서 됩니다</h1>
      <p className="lede">
        저희는 정리를 대신해주는 AI를 만든 게 아닙니다. 아무도 요청하지 않아도,
        다른 학교·다른 전공 사람의 결과물이 제 화면에 찾아오게 만든 겁니다.
      </p>
      <div className="actions">
        <Link className="btn primary" to="/create">
          스페이스 만들기
        </Link>
        <Link className="btn" to="/join">
          참여 코드로 입장
        </Link>
      </div>
    </main>
  )
}

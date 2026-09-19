import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./MainPage.css";

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function MainPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(
    sessionStorage.getItem("prizm_test_nickname") || ""
  );
  const [email, setEmail] = useState(
    sessionStorage.getItem("prizm_test_email") || ""
  );
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [sort, setSort] = useState("최근 수정순");
  const [openSpaceMenu, setOpenSpaceMenu] = useState(null);

  const [editingSpace, setEditingSpace] = useState(null);
  const [editingName, setEditingName] = useState("");

  const [copiedType, setCopiedType] = useState("");
  const [draftInviteCode, setDraftInviteCode] = useState("");

  const [joinCode, setJoinCode] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [joinStatus, setJoinStatus] = useState("");

  const [spaceName, setSpaceName] = useState("");
  const [spaceDescription, setSpaceDescription] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("사용자 정보 불러오기 실패:", error);
        return;
      }

      if (user) {
        const supabaseNickname = user.user_metadata?.nickname;

        if (supabaseNickname) {
          setNickname(supabaseNickname);
          sessionStorage.setItem("prizm_test_nickname", supabaseNickname);
        }

        if (user.email) {
          setEmail(user.email);
          sessionStorage.setItem("prizm_test_email", user.email);
        }
      }
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("로그아웃 실패:", error);
      return;
    }
    navigate("/");
  };

  const [spaces, setSpaces] = useState([
    {
      id: 1,
      name: "PRIZM 해커톤",
      description: "AI 기반 팀 협업 프로젝트",
      inviteCode: "PRIZM-8K2F",
      members: [
        { initial: "R", name: "리즘" },
        { initial: "S", name: "수민" },
        { initial: "J", name: "지수" },
      ],
      updated: "2시간 전",
      favorite: true,
    },
    {
      id: 2,
      name: "서비스 기획",
      description: "팀 아이디어를 정리하는 공간",
      inviteCode: "PLAN-5M9Q",
      members: [
        { initial: "R", name: "리즘" },
        { initial: "M", name: "민지" },
      ],
      updated: "어제",
      favorite: false,
    },
    {
      id: 3,
      name: "개인 작업실",
      description: "나만의 생각과 기록",
      inviteCode: "RISM-3P7X",
      members: [{ initial: "R", name: "리즘" }],
      updated: "3일 전",
      favorite: false,
    },
  ]);

  const [invitations, setInvitations] = useState([
    {
      id: 101,
      name: "디자인 레퍼런스",
      description: "다양한 레퍼런스를 모아봐요.",
      inviter: "김지수",
      inviteCode: "REF-9T4M",
      members: [
        { initial: "J", name: "김지수" },
        { initial: "R", name: "리즘" },
      ],
    },
  ]);

  const joinableSpaces = [
    {
      id: 201,
      name: "디자인 시스템 구축",
      description: "팀 디자인 시스템과 UI 가이드를 정리하는 공간",
      inviteCode: "DESIGN-24A7",
      members: [
        { initial: "H", name: "하린" },
        { initial: "D", name: "도윤" },
        { initial: "R", name: "리즘" },
      ],
      updated: "방금 전",
      favorite: false,
    },
    {
      id: 202,
      name: "AI 아이디어 랩",
      description: "AI 서비스 아이디어를 함께 발전시키는 공간",
      inviteCode: "AI-7LAB",
      members: [
        { initial: "J", name: "지훈" },
        { initial: "R", name: "리즘" },
      ],
      updated: "방금 전",
      favorite: false,
    },
  ];

  const notifications = [
    {
      id: 1,
      title: "새로운 스페이스 초대",
      text: "김지수님이 디자인 레퍼런스에 초대했어요.",
      time: "5분 전",
      unread: true,
    },
    {
      id: 2,
      title: "새로운 결과물이 추가됐어요",
      text: "PRIZM 해커톤에 새로운 결과물이 등록됐어요.",
      time: "1시간 전",
      unread: true,
    },
    {
      id: 3,
      title: "스페이스 업데이트",
      text: "서비스 기획 스페이스가 업데이트됐어요.",
      time: "어제",
      unread: false,
    },
  ];

  const toggleFavorite = (id) => {
    setSpaces((prev) =>
      prev.map((space) =>
        space.id === id
          ? { ...space, favorite: !space.favorite }
          : space
      )
    );
    setOpenSpaceMenu(null);
  };

  const sortedSpaces = [...spaces].sort((a, b) => {
    if (a.favorite !== b.favorite) {
      return Number(b.favorite) - Number(a.favorite);
    }

    if (sort === "이름순") {
      return a.name.localeCompare(b.name, "ko");
    }

    return 0;
  });

  const makeInviteCode = () => {
    const random = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

    return `PRIZM-${random}`;
  };

  const createSpace = () => {
    if (!spaceName.trim()) {
      alert("스페이스 이름을 입력해주세요!");
      return;
    }

    const newSpace = {
      id: Date.now(),
      name: spaceName.trim(),
      description: spaceDescription.trim() || "새로운 프로젝트 공간",
      inviteCode: draftInviteCode || makeInviteCode(),
      members: [{ initial: nickname.charAt(0).toUpperCase(), name: nickname }],
      updated: "방금 전",
      favorite: false,
    };

    setSpaces((prev) => [...prev, newSpace]);

    setSpaceName("");
    setSpaceDescription("");
    setDraftInviteCode("");
    setCopiedType("");
    setShowModal(false);
  };

  const joinSpace = (invitation) => {
    const alreadyJoined = spaces.some(
      (space) => space.inviteCode === invitation.inviteCode
    );

    if (alreadyJoined) {
      setInvitations((prev) =>
        prev.filter((item) => item.id !== invitation.id)
      );
      return;
    }

    setSpaces((prev) => [
      ...prev,
      {
        id: invitation.id,
        name: invitation.name,
        description: invitation.description,
        inviteCode: invitation.inviteCode,
        members: invitation.members,
        updated: "방금 전",
        favorite: false,
      },
    ]);

    setInvitations((prev) =>
      prev.filter((item) => item.id !== invitation.id)
    );
  };

  const declineInvitation = (id) => {
    setInvitations((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  const joinByCode = () => {
    const normalizedCode = joinCode.trim().toUpperCase();

    if (!normalizedCode) {
      setJoinStatus("error");
      setJoinMessage("참여 코드를 입력해주세요.");
      return;
    }

    if (
      spaces.some(
        (space) =>
          space.inviteCode.toUpperCase() === normalizedCode
      )
    ) {
      setJoinStatus("error");
      setJoinMessage("이미 참여 중인 스페이스예요.");
      return;
    }

    const invitationTarget = invitations.find(
      (invitation) =>
        invitation.inviteCode.toUpperCase() === normalizedCode
    );

    if (invitationTarget) {
      joinSpace(invitationTarget);
      setJoinStatus("success");
      setJoinMessage(`${invitationTarget.name}에 참여했어요!`);
      setJoinCode("");
      return;
    }

    const targetSpace = joinableSpaces.find(
      (space) =>
        space.inviteCode.toUpperCase() === normalizedCode
    );

    if (!targetSpace) {
      setJoinStatus("error");
      setJoinMessage("유효하지 않은 참여 코드예요.");
      return;
    }

    setSpaces((prev) => [
      ...prev,
      {
        ...targetSpace,
        updated: "방금 전",
      },
    ]);

    setJoinStatus("success");
    setJoinMessage(`${targetSpace.name}에 참여했어요!`);
    setJoinCode("");
  };

  const toggleSpaceMenu = (id) => {
    setOpenSpaceMenu((prev) =>
      prev === id ? null : id
    );
  };

  const startRename = (space) => {
    setEditingSpace(space);
    setEditingName(space.name);
    setOpenSpaceMenu(null);
  };

  const saveRename = () => {
    if (!editingName.trim()) {
      alert("스페이스 이름을 입력해주세요.");
      return;
    }

    setSpaces((prev) =>
      prev.map((space) =>
        space.id === editingSpace.id
          ? {
              ...space,
              name: editingName.trim(),
              updated: "방금 전",
            }
          : space
      )
    );

    setEditingSpace(null);
    setEditingName("");
  };

  const deleteSpace = (space) => {
    const confirmed = window.confirm(
      `"${space.name}" 스페이스를 삭제할까요?`
    );

    if (!confirmed) return;

    setSpaces((prev) =>
      prev.filter((item) => item.id !== space.id)
    );

    setOpenSpaceMenu(null);
  };

  const getInviteLink = (inviteCode) => {
    return `${window.location.origin}/join/${inviteCode}`;
  };

  const copyText = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);

      setTimeout(() => {
        setCopiedType("");
      }, 1600);
    } catch {
      alert("복사에 실패했어요.");
    }
  };

  return (
    <div
      className="app"
      onClick={() => {
        setOpenSpaceMenu(null);
        setShowNotifications(false);
        setShowProfile(false);
      }}
    >
      <header className="header">
        <div className="logo" aria-label="PRIZM">
          {"PRIZM".split("").map((letter, index) => (
            <span
              key={index}
              style={{ "--index": index }}
            >
              {letter}
            </span>
          ))}
        </div>

        <div className="header-right">
          <div
            className="notification-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="notification-button"
              aria-label="알림"
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setShowProfile(false);
                setOpenSpaceMenu(null);
              }}
            >
              <BellIcon />
              <span className="notification-dot" />
            </button>

            {showNotifications && (
              <div className="notification-menu">
                <div className="notification-header">
                  <h3>알림</h3>
                  <span>최근 알림</span>
                </div>

                <div className="notification-list">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${
                        notification.unread ? "unread" : ""
                      }`}
                    >
                      {notification.unread && (
                        <span className="unread-dot" />
                      )}

                      <div className="notification-content">
                        <strong>{notification.title}</strong>
                        <p>{notification.text}</p>
                        <span className="notification-time">
                          {notification.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className="profile-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="profile"
              onClick={() => {
                setShowProfile((prev) => !prev);
                setShowNotifications(false);
                setOpenSpaceMenu(null);
              }}
            >
              <div className="profile-circle">
                {nickname.charAt(0).toUpperCase()}
              </div>
              <span className="profile-name">{nickname}</span>
              <span className="profile-arrow">▾</span>
            </button>

            {showProfile && (
              <div className="profile-menu">
                <div className="profile-menu-user">
                  <div className="profile-circle large">
                    {nickname.charAt(0).toUpperCase()}
                  </div>

                  <div className="profile-menu-text">
                    <strong>{nickname}</strong>
                    <p>{email}</p>
                  </div>
                </div>

                <div className="divider" />

                <button className="menu-item">프로필</button>
                <button className="menu-item">계정 설정</button>
                <button className="menu-item">환경 설정</button>

                <div className="divider" />

                <button className="menu-item logout" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <section className="welcome">
          <h1>
            안녕하세요, {nickname}님! <span>👋</span>
          </h1>
          <p>
            오늘도 좋은 아이디어가 멋진 프로젝트로 이어지길 바라요.
          </p>
        </section>

        <section className="space-section">
          {/* 제목 */}
          <div className="space-title-row">
            <div className="section-title">
              <h2>내 스페이스</h2>
              <span className="space-count">
                {spaces.length}
              </span>
            </div>

            <select
              className="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option>최근 수정순</option>
              <option>이름순</option>
            </select>
          </div>

          {/* 스페이스 카드 */}
          <div className="main-space-grid">
            {sortedSpaces.map((space) => (
              <div
                className="space-card"
                key={space.id}
              >
                <div className="card-top">
                  <span className="space-label">
                    SPACE
                  </span>

                  <div className="card-actions">
                    <button
                      className={`favorite-button ${
                        space.favorite ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(space.id);
                      }}
                    >
                      {space.favorite ? "★" : "☆"}
                    </button>

                    <div
                      className="more-wrapper"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="more-button"
                        onClick={() => {
                          toggleSpaceMenu(space.id);
                          setShowProfile(false);
                          setShowNotifications(false);
                        }}
                      >
                        •••
                      </button>

                      {openSpaceMenu === space.id && (
                        <div className="space-menu">
                          <button
                            className="space-menu-item"
                            onClick={() => startRename(space)}
                          >
                            <EditIcon />
                            <span>이름 변경</span>
                          </button>

                          <div className="space-menu-divider" />

                          <button
                            className="space-menu-item delete"
                            onClick={() => deleteSpace(space)}
                          >
                            <TrashIcon />
                            <span>스페이스 삭제</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-content">
                  <h3>{space.name}</h3>
                  <p>{space.description}</p>
                </div>

                <div className="card-bottom">
                  <div className="members">
                    {space.members.map((member, index) => (
                      <div
                        className="member-wrapper"
                        key={`${space.id}-${index}`}
                      >
                        <div className="member-avatar">
                          {member.initial}
                        </div>

                        <div className="member-tooltip">
                          {member.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  <span className="updated">
                    {space.updated}
                  </span>
                </div>
              </div>
            ))}

            <button
              className="space-card create-card"
              onClick={(e) => {
                e.stopPropagation();
                setDraftInviteCode(makeInviteCode());
                setCopiedType("");
                setShowModal(true);
                setShowProfile(false);
                setShowNotifications(false);
                setOpenSpaceMenu(null);
              }}
            >
              <span className="create-plus">+</span>
              <span className="create-text">
                새 스페이스 만들기
              </span>
            </button>
          </div>

          {/* 참여코드 - 카드 아래 */}
          <div className="join-code-area">
            <div className="join-code-left">
              <div className="join-code-icon">
                <LinkIcon />
              </div>

              <span className="join-code-title">
                스페이스 참여
              </span>

              <div className="join-code-form">
                <input
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(
                      e.target.value.toUpperCase()
                    );
                    setJoinMessage("");
                    setJoinStatus("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      joinByCode();
                    }
                  }}
                  placeholder="참여 코드를 입력하세요"
                />

                <button onClick={joinByCode}>
                  참여하기
                </button>
              </div>
            </div>

            {joinMessage && (
              <span
                className={`join-code-message ${joinStatus}`}
              >
                {joinMessage}
              </span>
            )}
          </div>
        </section>

        {/* 초대받은 스페이스 */}
        {invitations.length > 0 && (
          <section className="invitation-section">
            <div className="section-title invitation-title">
              <h2>초대받은 스페이스</h2>
              <span className="space-count">
                {invitations.length}
              </span>
            </div>

            <div className="invitation-list">
              {invitations.map((invitation) => (
                <div
                  className="invitation-card"
                  key={invitation.id}
                >
                  <div className="invitation-info">
                    <span className="space-label">
                      SPACE
                    </span>

                    <h3>{invitation.name}</h3>
                    <p>{invitation.description}</p>

                    <div className="inviter">
                      <span className="inviter-avatar">
                        {invitation.inviter.charAt(0)}
                      </span>

                      <span>
                        {invitation.inviter}님이 초대했어요.
                      </span>
                    </div>
                  </div>

                  <div className="invite-buttons">
                    <button
                      className="decline"
                      onClick={() =>
                        declineInvitation(invitation.id)
                      }
                    >
                      거절
                    </button>

                    <button
                      className="join"
                      onClick={() =>
                        joinSpace(invitation)
                      }
                    >
                      참여하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 새 스페이스 */}
      {showModal && (
        <div
          className="modal-background"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>새 스페이스 만들기</h2>
                <p>
                  새로운 프로젝트 공간을 만들어보세요.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <label>스페이스 이름</label>
            <input
              value={spaceName}
              onChange={(e) =>
                setSpaceName(e.target.value)
              }
              placeholder="예: PRIZM 해커톤"
              autoFocus
            />

            <label>프로젝트 설명</label>
            <textarea
              value={spaceDescription}
              onChange={(e) =>
                setSpaceDescription(e.target.value)
              }
              placeholder="프로젝트를 간단하게 설명해주세요."
            />

            <label>팀원 초대</label>

            <div className="share-list create-share-list">
              <div className="share-row">
                <div className="share-info">
                  <span className="share-label">초대 링크</span>
                  <span className="share-value">
                    {getInviteLink(draftInviteCode)}
                  </span>
                </div>

                <button
                  type="button"
                  className="share-copy-button"
                  onClick={() =>
                    copyText(getInviteLink(draftInviteCode), "create-link")
                  }
                >
                  <CopyIcon />
                  {copiedType === "create-link" ? "복사됨" : "복사"}
                </button>
              </div>

              <div className="share-row">
                <div className="share-info">
                  <span className="share-label">참여 코드</span>
                  <span className="share-value code-value">
                    {draftInviteCode}
                  </span>
                </div>

                <button
                  type="button"
                  className="share-copy-button"
                  onClick={() =>
                    copyText(draftInviteCode, "create-code")
                  }
                >
                  <CopyIcon />
                  {copiedType === "create-code" ? "복사됨" : "복사"}
                </button>
              </div>
            </div>

            <div className="modal-buttons">
              <button
                className="cancel-button"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>

              <button
                className="create-button"
                onClick={createSpace}
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이름 변경 */}
      {editingSpace && (
        <div
          className="modal-background"
          onClick={() => setEditingSpace(null)}
        >
          <div
            className="rename-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>스페이스 이름 변경</h2>
                <p>새로운 이름을 입력해주세요.</p>
              </div>

              <button
                className="close-button"
                onClick={() => setEditingSpace(null)}
              >
                ×
              </button>
            </div>

            <label>스페이스 이름</label>

            <input
              autoFocus
              value={editingName}
              onChange={(e) =>
                setEditingName(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveRename();
                }
              }}
            />

            <div className="modal-buttons">
              <button
                className="cancel-button"
                onClick={() => setEditingSpace(null)}
              >
                취소
              </button>

              <button
                className="create-button"
                onClick={saveRename}
              >
                변경하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MainPage;

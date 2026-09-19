@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    Inter,
    Pretendard,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  background:
    radial-gradient(circle at 30% 5%, #fff 0%, transparent 35%),
    #f8f8fc;

  color: #171927;
  -webkit-font-smoothing: antialiased;
}

button,
input,
textarea,
select {
  font-family: inherit;
}

button {
  cursor: pointer;
}

.app {
  min-height: 100vh;
}

/* HEADER */

.header {
  position: relative;
  z-index: 1000;

  height: 76px;
  padding: 0 5%;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid #eeeef4;
  backdrop-filter: blur(12px);
}

/* LOGO */

.logo {
  display: flex;
  align-items: center;

  color: #665cff;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 2.8px;
  line-height: 1;
}

.logo span {
  display: inline-block;

  opacity: 0;
  transform: translateX(42px);

  animation: logoEnter 1.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--index) * 0.2s);
}

@keyframes logoEnter {
  0% {
    opacity: 0;
    transform: translateX(42px);
  }

  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* HEADER RIGHT */

.header-right {
  display: flex;
  align-items: center;
  gap: 13px;
}

/* NOTIFICATION */

.notification-wrapper {
  position: relative;
  z-index: 2000;
}

.notification-button {
  position: relative;

  width: 38px;
  height: 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: none;
  border-radius: 10px;

  background: transparent;
  color: #747a91;
}

.notification-button:hover {
  background: #f5f4fa;
  color: #5f6477;
}

.notification-dot {
  position: absolute;
  top: 6px;
  right: 6px;

  width: 8px;
  height: 8px;

  border: 2px solid white;
  border-radius: 50%;

  background: #ff5555;
}

.notification-menu {
  position: absolute;
  top: 51px;
  right: 0;
  z-index: 2000;

  width: 355px;

  overflow: hidden;

  background: white;
  border: 1px solid #ececf2;
  border-radius: 15px;

  box-shadow: 0 18px 50px rgba(38, 35, 80, 0.16);

  text-align: left;
}

.notification-header {
  height: 60px;
  padding: 0 18px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  border-bottom: 1px solid #eeeef3;

  text-align: left;
}

.notification-header h3 {
  margin: 0;

  color: #252735;

  font-size: 15px;
  font-weight: 700;

  text-align: left;
}

.notification-header span {
  color: #969aad;
  font-size: 11px;
}

.notification-list {
  max-height: 330px;
  overflow-y: auto;

  text-align: left;
}

.notification-item {
  position: relative;

  width: 100%;

  padding: 16px 18px 16px 29px;

  border-bottom: 1px solid #f1f1f5;

  text-align: left;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: #faf9ff;
}

.notification-item.unread {
  background: #fdfcff;
}

.unread-dot {
  position: absolute;
  top: 21px;
  left: 14px;

  width: 6px;
  height: 6px;

  border-radius: 50%;
  background: #665cff;
}

.notification-content {
  width: 100%;
  text-align: left;
}

.notification-content strong {
  display: block;

  margin: 0 0 5px;

  color: #252735;

  font-size: 13px;
  font-weight: 600;

  text-align: left;
}

.notification-content p {
  display: block;

  margin: 0 0 7px;

  color: #777d91;

  font-size: 12px;
  line-height: 1.5;

  text-align: left;
}

.notification-time {
  display: block;

  color: #aaadba;

  font-size: 10px;

  text-align: left;
}

/* PROFILE */

.profile-wrapper {
  position: relative;
  z-index: 2000;
}

.profile {
  display: flex;
  align-items: center;
  gap: 6px;

  padding: 5px 7px;

  border: none;
  border-radius: 10px;

  background: transparent;
  color: #20212a;

  font-size: 14px;
}

.profile:hover {
  background: #f5f4fa;
}

.profile-circle {
  width: 38px;
  height: 38px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #eeecff;
  color: #685fff;

  font-weight: 600;
}

.profile-circle.large {
  width: 44px;
  height: 44px;
}

.profile-name {
  margin: 0;

  font-weight: 700;
  line-height: 1;
}

.profile-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  margin-left: -2px;

  color: #82879a;

  font-size: 12px;
  line-height: 1;

  transform: translateY(-1px);
}

/* PROFILE MENU */

.profile-menu {
  position: absolute;
  right: 0;
  top: 55px;
  z-index: 2000;

  width: 265px;
  padding: 11px;

  background: white;

  border: 1px solid #ececf2;
  border-radius: 15px;

  box-shadow: 0 16px 45px rgba(38, 35, 80, 0.16);
}

.profile-menu-user {
  display: flex;
  align-items: center;
  justify-content: flex-start;

  gap: 11px;

  padding: 9px 5px;

  text-align: left;
}

.profile-menu-text {
  min-width: 0;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  text-align: left;
}

.profile-menu-user strong {
  margin: 0;

  color: #202230;

  font-size: 14px;
  font-weight: 700;
}

.profile-menu-user p {
  margin: 4px 0 0;

  color: #9296a9;
  font-size: 12px;
}

.divider {
  height: 1px;
  margin: 8px 3px;

  background: #eeeef3;
}

.menu-item {
  width: 100%;
  padding: 10px;

  display: flex;
  align-items: center;

  border: none;
  border-radius: 8px;

  background: transparent;
  color: #353846;

  font-size: 13px;
  font-weight: 500;

  text-align: left;
}

.menu-item:hover {
  background: #f6f5fa;
}

.menu-item.logout {
  color: #ef4f4f;
}

/* MAIN */

.main {
  position: relative;
  z-index: 1;

  width: min(1380px, 90%);
  margin: 0 auto;

  padding: 75px 0 85px;
}

/* WELCOME */

.welcome {
  margin-bottom: 67px;
}

.welcome h1 {
  margin: 0 0 11px;

  color: #151725;

  font-size: 34px;
  font-weight: 700;
  letter-spacing: -1.2px;
}

.welcome h1 span {
  font-size: 30px;
}

.welcome p {
  margin: 0;

  color: #7e849a;
  font-size: 16px;
}

/* SPACE TITLE */

.space-title-row {
  margin-bottom: 20px;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title h2 {
  margin: 0;

  color: #181a27;

  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.space-count {
  color: #898ea2;
  font-size: 14px;
}

.sort-select {
  height: 40px;
  padding: 0 13px;

  border: 1px solid #e3e4ed;
  border-radius: 9px;

  outline: none;

  background: white;
  color: #62687d;

  font-size: 12px;
}

.sort-select:focus {
  border-color: #b8b3ff;
}

/* SPACE GRID */

.main-space-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

/* SPACE CARD */

.space-card {
  position: relative;

  height: 260px;
  padding: 25px;

  display: flex;
  flex-direction: column;

  text-align: left;

  background: rgba(255, 255, 255, 0.96);

  border: 1px solid #ececf2;
  border-radius: 17px;

  box-shadow: 0 6px 22px rgba(34, 31, 70, 0.035);

  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.space-card:hover {
  transform: translateY(-3px);

  border-color: #d7d4ff;

  box-shadow: 0 13px 35px rgba(55, 48, 120, 0.08);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.space-label {
  display: inline-flex;
  align-items: center;

  width: fit-content;

  padding: 5px 10px;

  border-radius: 7px;

  background: #efedff;
  color: #675dff;

  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.4px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.favorite-button,
.more-button {
  border: none;

  background: transparent;
  color: #858a9c;
}

.favorite-button {
  font-size: 20px;
}

.favorite-button:hover,
.favorite-button.active {
  color: #ffbd2e;
}

.more-button {
  padding: 3px 2px 8px;

  font-size: 17px;
  letter-spacing: 1px;
}

.more-button:hover {
  color: #555a6d;
}

/* CARD MENU */

.more-wrapper {
  position: relative;
}

.space-menu {
  position: absolute;
  top: 29px;
  right: 0;
  z-index: 100;

  width: 170px;
  padding: 6px;

  background: white;

  border: 1px solid #e9e9f0;
  border-radius: 11px;

  box-shadow: 0 12px 35px rgba(35, 32, 70, 0.13);
}

.space-menu-item {
  width: 100%;
  padding: 10px 11px;

  display: flex;
  align-items: center;
  gap: 9px;

  border: none;
  border-radius: 7px;

  background: transparent;
  color: #444756;

  font-size: 12px;
  font-weight: 500;

  text-align: left;
}

.space-menu-item:hover {
  background: #f6f5fa;
}

.space-menu-item.delete {
  color: #ef4f4f;
}

.space-menu-item.delete:hover {
  background: #fff4f4;
}

.space-menu-divider {
  height: 1px;
  margin: 4px 5px;

  background: #eeeef3;
}

/* CARD CONTENT */

.card-content {
  margin-top: 28px;
  text-align: left;
}

.card-content h3 {
  margin: 0 0 9px;

  color: #171927;

  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.4px;
}

.card-content p {
  margin: 0;

  color: #7f859b;

  font-size: 14px;
  line-height: 1.5;
}

.card-bottom {
  margin-top: auto;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.members {
  display: flex;
  align-items: center;
}

.member-wrapper {
  position: relative;
  margin-right: -5px;
}

.member-avatar {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 3px solid white;
  border-radius: 50%;

  background: #eeecff;
  color: #655dff;

  font-size: 12px;
  font-weight: 600;
}

.member-wrapper:nth-child(2) .member-avatar {
  background: #f0f1f6;
  color: #363947;
}

.member-wrapper:nth-child(3) .member-avatar {
  background: #e8eaf1;
  color: #363947;
}

.member-tooltip {
  position: absolute;

  left: 50%;
  bottom: 44px;
  z-index: 150;

  transform: translateX(-50%) translateY(4px);

  padding: 6px 9px;

  white-space: nowrap;

  border-radius: 7px;

  background: #292a35;
  color: white;

  font-size: 11px;

  opacity: 0;
  visibility: hidden;

  pointer-events: none;

  transition: 0.15s ease;
}

.member-tooltip::after {
  content: "";

  position: absolute;

  left: 50%;
  top: 100%;

  transform: translateX(-50%);

  border: 4px solid transparent;
  border-top-color: #292a35;
}

.member-wrapper:hover .member-tooltip {
  opacity: 1;
  visibility: visible;

  transform: translateX(-50%) translateY(0);
}

.updated {
  color: #858a9d;
  font-size: 11px;
}

/* CREATE CARD */

.create-card {
  width: 100%;

  align-items: center;
  justify-content: center;
  gap: 15px;

  border: 1.5px dashed #bcb8ff;

  background: rgba(250, 249, 255, 0.65);
  color: #655cff;

  text-align: center;
}

.create-card:hover {
  background: #f5f3ff;
  border-color: #6c63ff;
}

.create-plus {
  font-size: 52px;
  font-weight: 300;
  line-height: 0.8;
}

.create-text {
  font-size: 13px;
  font-weight: 500;
}

/* JOIN CODE - 카드 아래 */

.join-code-area {
  width: 100%;
  min-height: 62px;

  margin-top: 24px;
  padding: 11px 14px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: rgba(255, 255, 255, 0.72);

  border: 1px solid #e8e8f0;
  border-radius: 12px;
}

.join-code-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.join-code-icon {
  width: 34px;
  height: 34px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;

  background: #efedff;
  color: #665cff;
}

.join-code-title {
  margin-right: 6px;

  color: #45495b;

  font-size: 12px;
  font-weight: 600;

  white-space: nowrap;
}

.join-code-form {
  display: flex;
  align-items: center;
  gap: 7px;
}

.join-code-form input {
  width: 240px;
  height: 37px;

  padding: 0 12px;

  border: 1px solid #dedfe8;
  border-radius: 8px;

  outline: none;

  background: white;
  color: #373a49;

  font-size: 12px;

  text-transform: uppercase;
}

.join-code-form input::placeholder {
  color: #a1a5b4;
  text-transform: none;
}

.join-code-form input:focus {
  border-color: #928cff;

  box-shadow: 0 0 0 3px rgba(102, 92, 255, 0.07);
}

.join-code-form button {
  height: 37px;
  padding: 0 15px;

  border: none;
  border-radius: 8px;

  background: #665cff;
  color: white;

  font-size: 11px;
  font-weight: 600;
}

.join-code-form button:hover {
  background: #574ded;
}

.join-code-message {
  margin-right: 5px;

  font-size: 11px;
}

.join-code-message.success {
  color: #4c9a6a;
}

.join-code-message.error {
  color: #e45858;
}

/* INVITATIONS */

.invitation-section {
  margin-top: 45px;
  padding-top: 28px;

  border-top: 1px solid #e6e7ee;

  text-align: left;
}

.invitation-title {
  margin-bottom: 18px;

  justify-content: flex-start;

  text-align: left;
}

.invitation-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  gap: 12px;

  text-align: left;
}

.invitation-card {
  width: 675px;
  padding: 22px 25px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: white;

  border: 1px solid #ececf2;
  border-radius: 15px;

  box-shadow: 0 5px 20px rgba(40, 35, 80, 0.03);

  text-align: left;
}

.invitation-info {
  flex: 1;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  text-align: left;
}

.invitation-info .space-label {
  align-self: flex-start;
}

.invitation-card h3 {
  width: 100%;

  margin: 13px 0 5px;

  color: #202230;

  font-size: 17px;
  font-weight: 700;

  text-align: left;
}

.invitation-card p {
  width: 100%;

  margin: 0;

  color: #83899c;
  font-size: 13px;

  text-align: left;
}

.inviter {
  width: 100%;

  margin-top: 12px;

  display: flex;
  align-items: center;
  justify-content: flex-start;

  gap: 8px;

  color: #83899c;
  font-size: 12px;

  text-align: left;
}

.inviter-avatar {
  width: 25px;
  height: 25px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #eeeaff;
  color: #655cff;

  font-size: 11px;
  font-weight: 600;
}

.invite-buttons {
  flex-shrink: 0;

  display: flex;
  align-items: center;
  gap: 9px;
}

.decline,
.join {
  padding: 10px 19px;

  border-radius: 9px;

  font-size: 13px;
  font-weight: 600;
}

.decline {
  border: 1px solid #dedfe8;

  background: white;
  color: #54596c;
}

.decline:hover {
  background: #f7f7fa;
}

.join {
  border: none;

  background: #665cff;
  color: white;
}

.join:hover {
  background: #554bec;
}

/* MODALS */

.modal-background {
  position: fixed;
  inset: 0;
  z-index: 5000;

  padding: 20px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(26, 25, 43, 0.34);
  backdrop-filter: blur(4px);
}

.modal,
.rename-modal {
  max-width: 100%;
  padding: 31px;

  background: white;

  border-radius: 20px;

  box-shadow: 0 25px 70px rgba(30, 25, 70, 0.2);
}

.modal {
  width: 500px;
}

.rename-modal {
  width: 430px;
}

.modal-header {
  margin-bottom: 25px;

  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  text-align: left;
}

.modal-header h2 {
  margin: 0 0 6px;

  color: #1d1f2c;

  font-size: 21px;
  font-weight: 700;
}

.modal-header p {
  margin: 0;

  color: #8a8e9e;
  font-size: 13px;
}

.close-button {
  padding: 0;

  border: none;
  background: transparent;

  color: #838797;

  font-size: 25px;
  line-height: 1;
}

.modal label,
.rename-modal label {
  display: block;

  margin: 18px 0 7px;

  color: #343644;

  font-size: 13px;
  font-weight: 600;

  text-align: left;
}

.modal input,
.modal textarea,
.rename-modal input {
  width: 100%;
  padding: 13px 14px;

  border: 1px solid #dfe0e8;
  border-radius: 9px;

  outline: none;

  background: #fcfcfd;
  color: #333642;

  font-size: 13px;
}

.modal textarea {
  min-height: 90px;
  resize: vertical;
}

.modal input:focus,
.modal textarea:focus,
.rename-modal input:focus {
  border-color: #7169ff;

  box-shadow: 0 0 0 3px rgba(102, 92, 255, 0.09);
}

.modal-buttons {
  margin-top: 26px;

  display: flex;
  justify-content: flex-end;
  gap: 9px;
}

.cancel-button,
.create-button {
  padding: 10px 18px;

  border-radius: 9px;

  font-size: 13px;
  font-weight: 600;
}

.cancel-button {
  border: 1px solid #dedfe7;

  background: white;
  color: #555a6d;
}

.cancel-button:hover {
  background: #f7f7fa;
}

.create-button {
  border: none;

  background: #665cff;
  color: white;
}

.create-button:hover {
  background: #554bec;
}

/* INVITE MODAL */

.invite-modal {
  width: 500px;
  max-width: 100%;

  padding: 28px;

  background: white;

  border-radius: 18px;

  box-shadow: 0 25px 70px rgba(30, 25, 70, 0.18);

  text-align: left;
}

.invite-modal-header {
  margin-bottom: 22px;

  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  text-align: left;
}

.invite-modal-header > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.invite-modal-header h2 {
  margin: 0 0 5px;

  color: #202230;

  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.4px;
}

.invite-modal-header span {
  color: #9599aa;
  font-size: 12px;
}

.share-list {
  overflow: hidden;

  border: 1px solid #e8e8ef;
  border-radius: 12px;

  background: #fcfcfd;
}

.share-row {
  min-height: 76px;
  padding: 14px 15px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 15px;
}

.share-row + .share-row {
  border-top: 1px solid #e8e8ef;
}

.share-info {
  min-width: 0;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  gap: 6px;

  text-align: left;
}

.share-label {
  color: #777c8f;

  font-size: 10px;
  font-weight: 600;
}

.share-value {
  display: block;

  max-width: 330px;

  overflow: hidden;

  color: #373a49;

  font-size: 12px;
  font-weight: 500;

  white-space: nowrap;
  text-overflow: ellipsis;
}

.code-value {
  color: #665cff;

  font-size: 14px;
  font-weight: 700;

  letter-spacing: 0.7px;
}

.share-copy-button {
  height: 34px;

  flex-shrink: 0;

  padding: 0 11px;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 5px;

  border: 1px solid #dedfe8;
  border-radius: 8px;

  background: white;
  color: #626679;

  font-size: 10px;
  font-weight: 600;
}

.share-copy-button:hover {
  border-color: #cbc7ff;

  background: #f7f6ff;
  color: #665cff;
}

/* RESPONSIVE */

@media (max-width: 1100px) {
  .main-space-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .main {
    width: 90%;
    padding-top: 45px;
  }

  .welcome {
    margin-bottom: 45px;
  }

  .welcome h1 {
    font-size: 27px;
  }

  .main-space-grid {
    grid-template-columns: 1fr;
  }

  .join-code-area {
    align-items: flex-start;
    flex-direction: column;

    gap: 10px;
  }

  .join-code-left {
    width: 100%;

    flex-wrap: wrap;
  }

  .join-code-form {
    width: 100%;
  }

  .join-code-form input {
    flex: 1;
    width: auto;
  }

  .invitation-card {
    width: 100%;

    align-items: flex-start;
    flex-direction: column;

    gap: 20px;
  }

  .notification-menu {
    width: min(355px, 90vw);
  }
}

@media (max-width: 520px) {
  .profile-name {
    display: none;
  }

  .sort-select {
    height: 36px;
    padding: 0 9px;
  }

  .join-code-icon {
    display: none;
  }

  .invite-modal {
    padding: 22px;
  }

  .share-value {
    max-width: 190px;
  }
}

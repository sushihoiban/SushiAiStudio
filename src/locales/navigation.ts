
import { TranslationResource } from './types';

export const navigation: TranslationResource = {
  // Navbar
  home: {
    en: "Home", vi: "Trang chủ", ko: "홈", zh: "首页", ja: "ホーム", ru: "Главная", es: "Inicio", de: "Startseite", fr: "Accueil", tl: "Home", th: "หน้าหลัก", id: "Beranda"
  },
  menu: {
    en: "Menu", vi: "Thực đơn", ko: "메뉴", zh: "菜单", ja: "メニュー", ru: "Меню", es: "Menú", de: "Menü", fr: "Menu", tl: "Menu", th: "เมนู", id: "Menu"
  },
  reservations: {
    en: "Reservations", vi: "Đặt bàn", ko: "예약", zh: "预订", ja: "予約", ru: "Бронирование", es: "Reservas", de: "Reservierungen", fr: "Réservations", tl: "Reserbasyon", th: "จองโต๊ะ", id: "Reservasi"
  },
  book_table: {
    en: "Book Table", vi: "Đặt ngay", ko: "테이블 예약", zh: "预订餐桌", ja: "席を予約", ru: "Забронировать", es: "Reservar Mesa", de: "Tisch buchen", fr: "Réserver", tl: "Mag-book", th: "จองโต๊ะ", id: "Pesan Meja"
  },
  sign_in: {
    en: "Sign In", vi: "Đăng nhập", ko: "로그인", zh: "登录", ja: "ログイン", ru: "Войти", es: "Iniciar sesión", de: "Anmelden", fr: "Se connecter", tl: "Mag-sign In", th: "เข้าสู่ระบบ", id: "Masuk"
  },
  admin_dashboard: {
    en: "Admin Dashboard", vi: "Trang quản trị", ko: "관리자 대시보드", zh: "管理仪表板", ja: "管理画面", ru: "Панель админа", es: "Panel de Admin", de: "Admin-Dashboard", fr: "Tableau de bord admin", tl: "Admin Dashboard", th: "แผงควบคุมผู้ดูแล", id: "Dasbor Admin"
  },

  // Sidebar / Mobile
  profile: {
    en: "Profile", vi: "Hồ sơ", ko: "프로필", zh: "个人资料", ja: "プロフィール", ru: "Профиль", es: "Perfil", de: "Profil", fr: "Profil", tl: "Profile", th: "โปรไฟล์", id: "Profil"
  },
  my_reservations: {
    en: "My Reservations", vi: "Lịch sử đặt bàn", ko: "나의 예약", zh: "我的预订", ja: "予約履歴", ru: "Мои бронирования", es: "Mis Reservas", de: "Meine Reservierungen", fr: "Mes réservations", tl: "Aking Reserbasyon", th: "การจองของฉัน", id: "Reservasi Saya"
  },
  favorite_dishes: {
    en: "Favorite Dishes", vi: "Món yêu thích", ko: "즐겨찾는 메뉴", zh: "最爱菜肴", ja: "お気に入り", ru: "Любимые блюда", es: "Platos Favoritos", de: "Lieblingsgerichte", fr: "Plats favoris", tl: "Paboritong Pagkain", th: "จานโปรด", id: "Hidangan Favorit"
  },
  settings: {
    en: "Settings", vi: "Cài đặt", ko: "설정", zh: "设置", ja: "設定", ru: "Настройки", es: "Ajustes", de: "Einstellungen", fr: "Paramètres", tl: "Settings", th: "การตั้งค่า", id: "Pengaturan"
  },
  log_out: {
    en: "Log Out", vi: "Đăng xuất", ko: "로그아웃", zh: "退出", ja: "ログアウト", ru: "Выйти", es: "Cerrar sesión", de: "Abmelden", fr: "Déconnexion", tl: "Mag-log Out", th: "ออกจากระบบ", id: "Keluar"
  },
  exit_guest: {
    en: "Exit Guest Mode", vi: "Thoát chế độ khách", ko: "게스트 모드 종료", zh: "退出访客模式", ja: "ゲストモード終了", ru: "Выйти из гостевого", es: "Salir de Invitado", de: "Gastmodus beenden", fr: "Quitter le mode invité", tl: "Umalis sa Guest Mode", th: "ออกจากโหมดแขก", id: "Keluar Mode Tamu"
  },
  
  // Sidebar Subtitles
  sub_manage_bookings: {
    en: "Manage bookings and tables", vi: "Quản lý đặt bàn và bàn ăn", ko: "예약 및 테이블 관리", zh: "管理预订和餐桌", ja: "予約とテーブルを管理", ru: "Управление бронью и столами", es: "Gestionar reservas y mesas", de: "Buchungen und Tische verwalten", fr: "Gérer les réservations et tables", tl: "Pamahalaan ang bookings at mesa", th: "จัดการการจองและโต๊ะ", id: "Kelola pemesanan dan meja"
  },
  sub_view_history: {
    en: "View your booking history", vi: "Xem lịch sử đặt bàn của bạn", ko: "예약 기록 보기", zh: "查看您的预订历史", ja: "予約履歴を表示", ru: "Просмотр истории бронирований", es: "Ver historial de reservas", de: "Buchungshistorie anzeigen", fr: "Voir votre historique", tl: "Tingnan ang booking history", th: "ดูประวัติการจองของคุณ", id: "Lihat riwayat pemesanan"
  },
  sub_save_favorites: {
    en: "Save your favorite items", vi: "Lưu các món ăn yêu thích", ko: "즐겨찾는 항목 저장", zh: "保存您最喜爱的项目", ja: "お気に入りを保存", ru: "Сохранить любимые блюда", es: "Guarda tus platos favoritos", de: "Favoriten speichern", fr: "Enregistrer vos favoris", tl: "I-save ang paborito", th: "บันทึกเมนูโปรดของคุณ", id: "Simpan item favorit Anda"
  },
  sub_manage_alerts: {
    en: "Manage your alerts", vi: "Quản lý thông báo", ko: "알림 관리", zh: "管理您的提醒", ja: "アラートを管理", ru: "Управление уведомлениями", es: "Gestionar alertas", de: "Benachrichtigungen verwalten", fr: "Gérer vos alertes", tl: "Pamahalaan ang alerts", th: "จัดการการแจ้งเตือน", id: "Kelola peringatan Anda"
  },
  sub_app_prefs: {
    en: "App preferences", vi: "Tùy chọn ứng dụng", ko: "앱 환경설정", zh: "应用偏好设置", ja: "アプリの設定", ru: "Настройки приложения", es: "Preferencias de la app", de: "App-Einstellungen", fr: "Préférences de l'application", tl: "Mga kagustuhan sa app", th: "การตั้งค่าแอพ", id: "Preferensi aplikasi"
  },
  sub_app_info: {
    en: "App version & info", vi: "Thông tin & phiên bản", ko: "앱 버전 및 정보", zh: "应用版本和信息", ja: "アプリのバージョンと情報", ru: "Версия и информация", es: "Versión e información", de: "App-Version & Infos", fr: "Version et infos de l'app", tl: "Impormasyon ng app", th: "ข้อมูลและเวอร์ชันแอพ", id: "Versi & info aplikasi"
  },
  notifications: {
    en: "Notifications", vi: "Thông báo", ko: "알림", zh: "通知", ja: "通知", ru: "Уведомления", es: "Notificaciones", de: "Benachrichtigungen", fr: "Notifications", tl: "Abiso", th: "การแจ้งเตือน", id: "Notifikasi"
  },
  about: {
    en: "About", vi: "Giới thiệu", ko: "정보", zh: "关于", ja: "情報", ru: "О приложении", es: "Acerca de", de: "Über", fr: "À propos", tl: "Tungkol", th: "เกี่ยวกับ", id: "Tentang"
  },

  // Footer
  visit_us: {
    en: "Visit Our Restaurant", vi: "Ghé thăm nhà hàng", ko: "매장 방문", zh: "光临本店", ja: "店舗情報", ru: "Посетите нас", es: "Visita Nuestro Restaurante", de: "Besuchen Sie uns", fr: "Visitez notre restaurant", tl: "Bisitahin Kami", th: "เยี่ยมชมร้านอาหาร", id: "Kunjungi Restoran Kami"
  },
  location: {
    en: "Location", vi: "Địa chỉ", ko: "위치", zh: "地址", ja: "場所", ru: "Адрес", es: "Ubicación", de: "Standort", fr: "Emplacement", tl: "Lokasyon", th: "ที่ตั้ง", id: "Lokasi"
  },
  call_us: {
    en: "Call Us", vi: "Gọi ngay", ko: "전화하기", zh: "联系我们", ja: "電話する", ru: "Позвоните нам", es: "Llámanos", de: "Rufen Sie uns an", fr: "Appelez-nous", tl: "Tumawag sa Amin", th: "โทรหาเรา", id: "Hubungi Kami"
  },
  hours: {
    en: "Hours", vi: "Giờ mở cửa", ko: "영업 시간", zh: "营业时间", ja: "営業時間", ru: "Часы работы", es: "Horario", de: "Öffnungszeiten", fr: "Horaires", tl: "Oras", th: "เวลาทำการ", id: "Jam Buka"
  },
  rights_reserved: {
    en: "All rights reserved.", vi: "Bảo lưu mọi quyền.", ko: "All rights reserved.", zh: "版权所有。", ja: "All rights reserved.", ru: "Все права защищены.", es: "Todos los derechos reservados.", de: "Alle Rechte vorbehalten.", fr: "Tous droits réservés.", tl: "All rights reserved.", th: "สงวนลิขสิทธิ์", id: "Hak cipta dilindungi."
  },
  
  // Reservations
  no_bookings_hint: {
    en: "You haven't made any bookings yet.", vi: "Bạn chưa có đặt bàn nào.", ko: "아직 예약 내역이 없습니다.", zh: "您还没有任何预订。", ja: "まだ予約がありません。", ru: "У вас пока нет бронирований.", es: "Aún no has hecho ninguna reserva.", de: "Sie haben noch keine Buchungen vorgenommen.", fr: "Vous n'avez pas encore de réservations.", tl: "Wala ka pang nagagawang booking.", th: "คุณยังไม่มีประวัติการจอง", id: "Anda belum membuat pemesanan apa pun."
  }
};


import { TranslationResource } from './types';

export const booking: TranslationResource = {
  title: {
    en: "Reserve a Table", vi: "Đặt bàn", ko: "테이블 예약", zh: "预订餐桌", ja: "席を予約", ru: "Забронировать столик", es: "Reservar mesa", de: "Tisch reservieren", fr: "Réserver une table", tl: "Mag-reserve ng Mesa", th: "จองโต๊ะ", id: "Reservasi Meja"
  },
  party_size: {
    en: "Party Size", vi: "Số lượng khách", ko: "인원 수", zh: "人数", ja: "人数", ru: "Количество гостей", es: "Tamaño del grupo", de: "Anzahl der Personen", fr: "Taille du groupe", tl: "Bilang ng Tao", th: "จำนวนคน", id: "Jumlah Orang"
  },
  select_date: {
    en: "Select Date", vi: "Chọn ngày", ko: "날짜 선택", zh: "选择日期", ja: "日付を選択", ru: "Выберите дату", es: "Seleccionar fecha", de: "Datum wählen", fr: "Sélectionner la date", tl: "Piliin ang Petsa", th: "เลือกวันที่", id: "Pilih Tanggal"
  },
  duration: {
    en: "Duration", vi: "Thời lượng", ko: "기간", zh: "时长", ja: "時間", ru: "Продолжительность", es: "Duración", de: "Dauer", fr: "Durée", tl: "Tagal", th: "ระยะเวลา", id: "Durasi"
  },
  select_time: {
    en: "Select Time", vi: "Chọn giờ", ko: "시간 선택", zh: "选择时间", ja: "時間を選択", ru: "Выберите время", es: "Seleccionar hora", de: "Zeit wählen", fr: "Sélectionner l'heure", tl: "Piliin ang Oras", th: "เลือกเวลา", id: "Pilih Waktu"
  },
  lunch: {
    en: "Lunch", vi: "Bữa trưa", ko: "점심", zh: "午餐", ja: "ランチ", ru: "Обед", es: "Almuerzo", de: "Mittagessen", fr: "Déjeuner", tl: "Tanghalian", th: "มื้อเที่ยง", id: "Makan Siang"
  },
  dinner: {
    en: "Dinner", vi: "Bữa tối", ko: "저녁", zh: "晚餐", ja: "ディナー", ru: "Ужин", es: "Cena", de: "Abendessen", fr: "Dîner", tl: "Hapunan", th: "มื้อเย็น", id: "Makan Malam"
  },
  no_slots: {
    en: "No slots available", vi: "Hết chỗ", ko: "예약 가능 시간 없음", zh: "无可用时段", ja: "空き枠なし", ru: "Нет свободных мест", es: "No hay horarios disponibles", de: "Keine Plätze verfügbar", fr: "Aucun créneau disponible", tl: "Walang available na oras", th: "ไม่มีรอบว่าง", id: "Tidak ada slot tersedia"
  },
  selected_booking: {
    en: "Selected Booking", vi: "Đặt chỗ đã chọn", ko: "선택된 예약", zh: "已选预订", ja: "選択された予約", ru: "Выбранное бронирование", es: "Reserva seleccionada", de: "Ausgewählte Buchung", fr: "Réservation sélectionnée", tl: "Napiling Booking", th: "การจองที่เลือก", id: "Pemesanan Terpilih"
  },
  starts: {
    en: "Starts", vi: "Bắt đầu", ko: "시작", zh: "开始", ja: "開始", ru: "Начало", es: "Inicia", de: "Beginnt", fr: "Début", tl: "Magsisimula", th: "เริ่ม", id: "Mulai"
  },
  ends: {
    en: "Ends", vi: "Kết thúc", ko: "종료", zh: "结束", ja: "終了", ru: "Конец", es: "Termina", de: "Endet", fr: "Fin", tl: "Matatapos", th: "สิ้นสุด", id: "Selesai"
  },
  guest_details: {
    en: "Guest Details", vi: "Thông tin khách", ko: "게스트 정보", zh: "客人信息", ja: "お客様情報", ru: "Детали гостя", es: "Detalles del invitado", de: "Gastdetails", fr: "Détails de l'invité", tl: "Detalye ng Bisita", th: "ข้อมูลลูกค้า", id: "Detail Tamu"
  },
  confirm_button: {
    en: "Confirm", vi: "Xác nhận", ko: "확인", zh: "确认", ja: "確認", ru: "Подтвердить", es: "Confirmar", de: "Bestätigen", fr: "Confirmer", tl: "Kumpirmahin", th: "ยืนยัน", id: "Konfirmasi"
  },
  confirming: {
    en: "Confirming...", vi: "Đang xác nhận...", ko: "확인 중...", zh: "确认中...", ja: "確認中...", ru: "Подтверждение...", es: "Confirmando...", de: "Bestätige...", fr: "Confirmation...", tl: "Kinukumpirma...", th: "กำลังยืนยัน...", id: "Mengonfirmasi..."
  },
  success_title: {
    en: "Reservation Confirmed", vi: "Đặt bàn thành công", ko: "예약 확정됨", zh: "预订已确认", ja: "予約確定", ru: "Бронирование подтверждено", es: "Reserva confirmada", de: "Reservierung bestätigt", fr: "Réservation confirmée", tl: "Kumpirmado na ang Reserbasyon", th: "ยืนยันการจองแล้ว", id: "Reservasi Dikonfirmasi"
  },
  success_message: {
    en: "You're all set!", vi: "Bạn đã sẵn sàng!", ko: "준비 완료!", zh: "预订成功！", ja: "準備完了！", ru: "Всё готово!", es: "¡Todo listo!", de: "Alles bereit!", fr: "C'est tout bon !", tl: "Ayos na ang lahat!", th: "เรียบร้อยแล้ว!", id: "Semua beres!"
  },
  success_detail: {
    en: "Table for {partySize} on {date} at {time}.", 
    vi: "Bàn cho {partySize} người vào {date} lúc {time}.", 
    ko: "{date} {time}에 {partySize}명 예약.", 
    zh: "{date} {time} {partySize}人桌。", 
    ja: "{date} {time}に{partySize}名様。", 
    ru: "Столик на {partySize} персон, {date} в {time}.", 
    es: "Mesa para {partySize} el {date} a las {time}.", 
    de: "Tisch für {partySize} am {date} um {time}.", 
    fr: "Table pour {partySize} le {date} à {time}.", 
    tl: "Mesa para sa {partySize} sa {date} nang {time}.", 
    th: "โต๊ะสำหรับ {partySize} ท่าน วันที่ {date} เวลา {time}", 
    id: "Meja untuk {partySize} orang pada {date} pukul {time}."
  },
  error_no_tables: {
    en: "No suitable tables available.", vi: "Không có bàn phù hợp.", ko: "적합한 테이블이 없습니다.", zh: "没有合适的餐桌。", ja: "適切なテーブルがありません。", ru: "Нет подходящих столиков.", es: "No hay mesas adecuadas disponibles.", de: "Keine passenden Tische verfügbar.", fr: "Aucune table adaptée disponible.", tl: "Walang angkop na mesa.", th: "ไม่มีโต๊ะที่เหมาะสม", id: "Tidak ada meja yang cocok."
  },
  error_fill_details: {
    en: "Please fill in all details.", vi: "Vui lòng điền đầy đủ thông tin.", ko: "모든 세부 정보를 입력해주세요.", zh: "请填写所有详细信息。", ja: "すべての詳細を入力してください。", ru: "Пожалуйста, заполните все детали.", es: "Por favor complete todos los detalles.", de: "Bitte füllen Sie alle Details aus.", fr: "Veuillez remplir tous les détails.", tl: "Punan ang lahat ng detalye.", th: "กรุณากรอกข้อมูลให้ครบถ้วน", id: "Harap isi semua detail."
  }
};

import { QuestionRubric } from '../types';

export const HOTS_QUESTIONS: QuestionRubric[] = [
  {
    id: 1,
    topic: "QoS Metrics & Protocols",
    badge: "VoIP vs TCP",
    title: "1. Analisis Dampak Indikator QoS pada Aplikasi Real-Time vs TCP File Transfer",
    scenario: "Sebuah lab sekolah mengalami gangguan saat ujian voice/video conference (VoIP) karena audio putus-putus, sementara siswa lain mengunduh file ISO berbasis TCP secara bebas.",
    question: "Analisis mengapa paket UDP pada VoIP sangat peka terhadap Latency, Jitter, dan Packet Loss dibandingkan TCP, serta solusinya!",
    keywords: ["throughput", "latency", "jitter", "packet loss", "udp", "re-transmit"],
    placeholder: "Jelaskan perbedaan penanganan paket UDP vs TCP terkait ketiadaan re-transmit, dampak jitter terhadap buffer suara, dan solusi implementasi prioritas antrean...",
    explanationHint: "Kunci: UDP tidak memiliki mekanisme re-transmission sehingga packet loss langsung merusak data suara/real-time."
  },
  {
    id: 2,
    topic: "MikroTik Simple Queue",
    badge: "Burst Calculation",
    title: "2. Evaluasi Kalkulasi Perilaku Fitur Burst pada Router MikroTik",
    scenario: "Konfigurasi Simple Queue: Max-Limit = 8 Mbps, Burst-Limit = 20 Mbps, Burst-Threshold = 10 Mbps, Burst-Time = 8 detik.",
    question: "Hitung berapa detik client mendapat Burst-Limit (20 Mbps) dan jelaskan penyebab kecepatannya mendadak turun ke Max-Limit (8 Mbps)!",
    keywords: ["burst-limit", "burst-threshold", "burst-time", "rata-rata", "max-limit", "20", "8"],
    placeholder: "Tuliskan langkah kalkulasi durasi burst actual berdasarkan rumus rata-rata bergerak (moving average), perbandingan threshold dan limit...",
    explanationHint: "Kunci: Durasi burst = (Burst-Threshold * Burst-Time) / Burst-Limit = (10 * 8) / 20 = 4 detik."
  },
  {
    id: 3,
    topic: "Bandwidth Management",
    badge: "Token Bucket on Saturated Link",
    title: "3. Troubleshooting Fitur Burst / Token Bucket pada Saturated Link",
    scenario: "Pelanggan mengeluh fitur Burst/Token Bucket tidak pernah memberikan alokasi di atas Max-Limit saat total link dari ISP terpakai 100%.",
    question: "Analisis penyebab kegagalan Burst/Token Bucket pada jaringan ini dan syarat wajib dari alokasi ISP agar Burst berfungsi!",
    keywords: ["cadangan", "overflow", "terbatas", "max-limit", "isp", "100%"],
    placeholder: "Uraikan mengapa burst membutuhkan kapasitas link fisik/langganan ISP yang lebih tinggi daripada Max-Limit client dan keterbatasan saat link saturasi 100%...",
    explanationHint: "Kunci: Burst hanya bisa terwujud jika total bandwidth fisik dari ISP memiliki headroom/cadangan di atas max-limit antrean."
  },
  {
    id: 4,
    topic: "Queue Tree & Mangle HTB",
    badge: "Enterprise QoS Architecture",
    title: "4. Perancangan Arsitektur QoS Perusahaan Menggunakan Queue Tree & Mangle",
    scenario: "Kebutuhan pembagian bandwidth dinamis berprioritas tinggi untuk 3 divisi kantor (Eksekutif, Keuangan, Staf).",
    question: "Evaluasi keterbatasan Simple Queue dan rancanglah integrasi Mangle Packet Marking dengan Queue Tree HTB Hierarchy!",
    keywords: ["queue tree", "mangle", "hirarki", "htb", "grouping", "prioritas"],
    placeholder: "Jelaskan alur mangle mark-connection, mark-packet pada prerouting/forwarding, struktur parent-child HTB, dan parameter priority 1-8...",
    explanationHint: "Kunci: Gunakan Mangle IP Firewall untuk mark-packet lalu bangun struktur parent HTB dengan child queue bertingkat prioritas."
  },
  {
    id: 5,
    topic: "Bufferbloat & FIFO",
    badge: "PFIFO vs BFIFO",
    title: "5. Troubleshooting Buffer Bloat & Konsumsi Resource (PFIFO vs BFIFO)",
    scenario: "Router ber-CPU rendah mengalami pingsan (lag parah) saat Queue Size buffer dinaikkan ke 1000 pada FIFO.",
    question: "Jelaskan hubungan Queue Size, Buffer Bloat (lonjakan latency), dan bandingkan efisiensi CPU/RAM antara PFIFO vs BFIFO!",
    keywords: ["buffer", "queue size", "pfifo", "latency", "ram", "cpu", "delay"],
    placeholder: "Analisis fenomena penumpukan paket di buffer memory (bufferbloat) yang memicu RTT melonjak, serta perbedaan batasan ukuran paket (PFIFO) vs byte (BFIFO)...",
    explanationHint: "Kunci: Queue size terlalu besar menyebabkan paket tertahan lama di RAM (bufferbloat/latency), menguras memori router kecil."
  },
  {
    id: 6,
    topic: "Queue Types",
    badge: "RED vs UDP Gaming",
    title: "6. Evaluasi Queue Type RED (Random Early Detect) pada Trafik Game Online",
    scenario: "Game Center mengubah Queue Type ke RED, menyebabkan pemain game mengalami disconnect massal dan lag spike.",
    question: "Evaluasi penyebab teknis pengguguran acak RED merusak koneksi UDP game online dan sebutkan Queue Type pengganti yang lebih adil!",
    keywords: ["red", "random", "udp", "drop", "re-transmit", "pcq", "disconnect"],
    placeholder: "Jelaskan cara kerja RED mendrop paket sebelum antrean penuh untuk memberi sinyal TCP window size, serta mengapa hal ini fatal bagi paket UDP game online...",
    explanationHint: "Kunci: RED dirancang untuk TCP congestion control. Paket UDP tidak memiliki window size backoff sehingga drop acak langsung memutuskan sesi game."
  },
  {
    id: 7,
    topic: "Queue Types",
    badge: "SFQ Starvation vs PCQ",
    title: "7. Troubleshooting Masalah Starvation pada SFQ Akibat Aplikasi Torrent",
    scenario: "Lab sekolah menggunakan SFQ. Saat ada 1 pengguna menjalankan Torrent, pengguna lain mengalami starvation (tidak bisa browsing).",
    question: "Analisis keterbatasan 1024 Sub-Queue SFQ saat diserang koneksi torrent dan jelaskan solusinya berbasis PCQ!",
    keywords: ["sfq", "1024", "sub-queue", "torrent", "koneksi", "pcq", "starvation"],
    placeholder: "Uraikan hashing sub-queue SFQ yang habis dimonopoli oleh ratusan connection stream torrent, dan bagaimana PCQ mengelompokkan berdasarkan IP (src/dst)...",
    explanationHint: "Kunci: Torrent membuka ribuan koneksi konkuren yang membanjiri hash slot SFQ, sedangkan PCQ mengisolasi per IP pengguna."
  },
  {
    id: 8,
    topic: "Per-Connection Queuing",
    badge: "Classifier Configuration",
    title: "8. Koreksi Kesalahan Konfigurasi Classifier PCQ Upload vs Download",
    scenario: "Siswa mengatur Classifier Src-Address untuk Download dan Dst-Address untuk Upload sehingga pembagian bandwidth menjadi kacau.",
    question: "Analisis kesalahan logika penentuan Classifier tersebut dan jelaskan aturan baku Classifier PCQ untuk Upload vs Download!",
    keywords: ["src-address", "upload", "dst-address", "download", "classifier"],
    placeholder: "Identifikasi arah aliran trafik paket dari internet ke client vs client ke internet, serta konfigurasi classifier yang benar untuk sub-stream PCQ...",
    explanationHint: "Kunci: Download dikelompokkan berdasarkan Dst-Address (IP client penerima), Upload dikelompokkan berdasarkan Src-Address (IP client pengirim)."
  },
  {
    id: 9,
    topic: "PCQ Tuning & Scalability",
    badge: "Total Limit Calculation",
    title: "9. Kalkulasi & Troubleshooting Total Limit PCQ Skala Besar",
    scenario: "Gedung dengan 200 client menggunakan PCQ (Limit Sub-Queue = 50 packet), namun Total Limit dibiarkan default 2000 packet.",
    question: "Hitung Total Limit PCQ yang ideal berbasis rumus perkalian dan dampak jika Total Limit lebih kecil dari kebutuhan!",
    keywords: ["limit", "total limit", "sub-queue", "perkalian", "200", "10000"],
    placeholder: "Hitung kebutuhan total antrean (200 client * 50 limit = 10000) dan jelaskan dampak packet drop prematur pada sub-queue jika total limit terlalu kecil...",
    explanationHint: "Kunci: Total Limit ideal = Jumlah Sub-stream Aktif * Sub-queue Limit = 200 * 50 = 10.000 paket."
  },
  {
    id: 10,
    topic: "Simple Queue vs PCQ",
    badge: "Subnet Sharing Fallacy",
    title: "10. Analisis Miskonsepsi Target Subnet /24 Simple Queue vs PCQ Rate",
    scenario: "Admin mengisi Target = 192.168.10.0/24 Max-Limit = 10 Mbps di Simple Queue dengan harapan tiap siswa mendapat 10 Mbps.",
    question: "Analisis miskonsepsi shared limit subnet tersebut dan berikan solusi otomatisasi pembagian adil berbasis PCQ Rate!",
    keywords: ["simple queue", "subnet", "shared", "pcq rate", "otomatis", "10 mbps"],
    placeholder: "Jelaskan mengapa mengisi subnet /24 pada Simple Queue hanya menciptakan shared bandwidth untuk bersama, dan bagaimana PCQ Rate memberikan alokasi fix per host...",
    explanationHint: "Kunci: Simple Queue dengan subnet membagi 10 Mbps untuk seluruh 254 host bersama-sama, sedangkan PCQ Rate mengalokasikan tiap host kecepatan yang adil."
  }
];

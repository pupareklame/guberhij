
/**
 * limitService.ts - Silent Bridge
 * Berfungsi sebagai placeholder agar tidak merusak impor di komponen lain.
 * Tidak lagi melakukan pengecekan kunci secara aktif.
 */

export const checkAndRequestKey = async (): Promise<boolean> => {
  // Langsung berhasil tanpa memicu popup sistem
  return true;
};

export const promptNewKey = async () => {
  // Fungsi dinonaktifkan untuk mencegah popup "Choose a paid key"
  console.log("Sistem menggunakan kuota gratis bawaan akun.");
};

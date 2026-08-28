import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AppState>().user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('প্রোফাইল'),
        actions: [
          TextButton(
            onPressed: () async {
              context.read<AppState>().logout();
              Navigator.pushNamedAndRemoveUntil(context, '/phone', (_) => false);
            },
            child: const Text('লগআউট', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Avatar
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF6C3DF4), Color(0xFF3B82F6)]),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  user?.name?.isNotEmpty == true ? user!.name![0].toUpperCase() : '👤',
                  style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(user?.name ?? 'নাম নেই', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            Text(user?.phone ?? '', style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 32),
            // Info tiles
            _tile(Icons.phone, 'মোবাইল', user?.phone ?? '—'),
            if (user?.emergencyName != null)
              _tile(Icons.contact_emergency, 'জরুরি যোগাযোগ', '${user!.emergencyName} · ${user.emergencyContact}'),
            const SizedBox(height: 20),
            // Co-op info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F7FF),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E0FF)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(children: [
                    Text('🤝', style: TextStyle(fontSize: 20)),
                    SizedBox(width: 8),
                    Text('চালাও সমবায়', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  ]),
                  const SizedBox(height: 12),
                  _infoRow('ভূমিকা', 'যাত্রী সদস্য'),
                  _infoRow('প্ল্যাটফর্ম ফি', 'মাত্র ৯%'),
                  _infoRow('প্যাট্রোনেজ', 'যাত্রার সংখ্যা অনুপাতে'),
                  const SizedBox(height: 12),
                  const Text(
                    '"যারা চালায়, যারা চড়ে, তারাই মালিক"',
                    style: TextStyle(fontStyle: FontStyle.italic, fontSize: 13, color: Color(0xFF6C3DF4)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tile(IconData icon, String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E0FF)),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF6C3DF4), size: 22),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
          ]),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<DriverAppState>();
    final user = appState.user;
    final profile = appState.driverProfile;

    return Scaffold(
      appBar: AppBar(
        title: const Text('আমার প্রোফাইল'),
        actions: [
          TextButton(
            onPressed: () {
              appState.logout();
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
            // Avatar with online status
            Stack(
              alignment: Alignment.bottomRight,
              children: [
                Container(
                  width: 90, height: 90,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF22D3EE), Color(0xFF0EA5E9)]),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      user?['name']?.toString().isNotEmpty == true ? user!['name'].toString()[0].toUpperCase() : '🚖',
                      style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                Container(
                  width: 22, height: 22,
                  decoration: BoxDecoration(
                    color: appState.isOnline ? const Color(0xFF10B981) : Colors.grey,
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF0F172A), width: 3),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(user?['name']?.toString() ?? 'নাম নেই',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
            Text(user?['phone']?.toString() ?? '',
              style: TextStyle(color: Colors.white.withOpacity(0.5))),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: _kycColor(profile?['kyc_status']).withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: _kycColor(profile?['kyc_status']).withOpacity(0.3)),
              ),
              child: Text(_kycLabel(profile?['kyc_status']),
                style: TextStyle(color: _kycColor(profile?['kyc_status']), fontWeight: FontWeight.w600, fontSize: 12)),
            ),
            const SizedBox(height: 28),
            // Vehicle info
            if (profile != null) ...[
              _section('🚗 গাড়ির তথ্য', [
                _row('ধরন', profile['vehicle_type']?.toString() ?? '—'),
                _row('মেক/মডেল', '${profile['vehicle_make'] ?? ''} ${profile['vehicle_model'] ?? ''}'.trim()),
                _row('রং', profile['vehicle_color']?.toString() ?? '—'),
                _row('RC', profile['rc_number']?.toString() ?? '—'),
              ]),
              const SizedBox(height: 16),
              _section('📄 নথিপত্র', [
                _row('DL', profile['dl_number']?.toString() ?? '—'),
                _row('UPI', profile['upi_id']?.toString() ?? '—'),
              ]),
              const SizedBox(height: 16),
            ],
            // Stats
            _section('📊 পরিসংখ্যান', [
              _row('মোট যাত্রা', '${profile?['total_rides'] ?? 0}'),
              _row('রেটিং', '⭐ ${profile?['rating'] ?? 5.0}'),
            ]),
            const SizedBox(height: 16),
            // Co-op
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF22D3EE).withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('🤝 সমবায় সদস্যপদ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _row('ভূমিকা', 'চালক-সদস্য'),
                  _row('কমিশন', '৮-১০% (স্বচ্ছ)'),
                  _row('ভোটের অধিকার', 'সক্রিয়'),
                  const SizedBox(height: 10),
                  const Text('"তুমি চালাও, তুমি মালিক"',
                    style: TextStyle(fontStyle: FontStyle.italic, fontSize: 13, color: Color(0xFF22D3EE))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _kycColor(dynamic status) {
    switch (status) {
      case 'approved': return const Color(0xFF10B981);
      case 'in_review': return Colors.amber;
      case 'rejected': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _kycLabel(dynamic status) {
    switch (status) {
      case 'approved': return '✅ KYC অনুমোদিত';
      case 'in_review': return '⏳ পর্যালোচনাধীন';
      case 'rejected': return '❌ প্রত্যাখ্যাত';
      default: return '📋 KYC বাকি';
    }
  }

  Widget _section(String title, List<Widget> rows) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 12),
          ...rows,
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
          Flexible(child: Text(value.isEmpty ? '—' : value,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 13),
            overflow: TextOverflow.ellipsis, textAlign: TextAlign.end)),
        ],
      ),
    );
  }
}

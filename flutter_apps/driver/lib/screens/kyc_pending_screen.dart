import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/api_service.dart';

class KycPendingScreen extends StatefulWidget {
  const KycPendingScreen({super.key});

  @override
  State<KycPendingScreen> createState() => _KycPendingScreenState();
}

class _KycPendingScreenState extends State<KycPendingScreen> {
  Timer? _pollTimer;
  bool _refreshing = false;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    // Admins approve KYC in the web console; pick that up without a reinstall.
    _pollTimer = Timer.periodic(const Duration(seconds: 20), (_) => _checkStatus(showMessage: false));
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkStatus({required bool showMessage}) async {
    if (_refreshing || _navigated) return;
    setState(() => _refreshing = true);
    try {
      final res = await ApiService.getMe();
      final user = res['user'] as Map<String, dynamic>?;
      final profile = res['driverProfile'] as Map<String, dynamic>?;
      if (!mounted || user == null) return;

      context.read<DriverAppState>().setUser(user, profile);
      final kyc = profile?['kyc_status']?.toString() ?? 'pending';

      if (kyc == 'approved') {
        _navigated = true;
        _pollTimer?.cancel();
        Navigator.pushReplacementNamed(context, '/cockpit');
      } else if (kyc == 'rejected') {
        _navigated = true;
        _pollTimer?.cancel();
        Navigator.pushReplacementNamed(context, '/kyc');
      } else if (showMessage) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('আপনার নথি এখনও যাচাই করা হচ্ছে।')),
        );
      }
    } catch (e) {
      if (showMessage && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('স্ট্যাটাস পাওয়া যায়নি: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _refreshing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 110,
                height: 110,
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.amber.withValues(alpha: 0.3), width: 2),
                ),
                child: const Center(child: Text('⏳', style: TextStyle(fontSize: 52))),
              ),
              const SizedBox(height: 28),
              const Text(
                'যাচাই চলছে',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 12),
              Text(
                'আপনার নথিপত্র পর্যালোচনা করা হচ্ছে।\nসাধারণত ২৪-৪৮ ঘণ্টা সময় লাগে।',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 15, height: 1.6),
              ),
              const SizedBox(height: 40),
              // Steps
              _step('✅', 'নিবন্ধন সম্পন্ন', true),
              _step('🔄', 'নথিপত্র যাচাই', false, isActive: true),
              _step('🚖', 'চালক সক্রিয়', false),
              const SizedBox(height: 40),
              ElevatedButton.icon(
                onPressed: _refreshing ? null : () => _checkStatus(showMessage: true),
                icon: _refreshing
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.refresh),
                label: const Text('স্ট্যাটাস রিফ্রেশ করুন'),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('যোগাযোগ করুন', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    SizedBox(height: 8),
                    Row(children: [
                      Icon(Icons.phone, color: Color(0xFF22D3EE), size: 16),
                      SizedBox(width: 8),
                      Text('support@chalao.coop', style: TextStyle(color: Colors.white70)),
                    ]),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _step(String icon, String label, bool done, {bool isActive = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: done ? const Color(0xFF10B981).withValues(alpha: 0.1)
                  : isActive ? Colors.amber.withValues(alpha: 0.1)
                  : const Color(0xFF1E293B),
              shape: BoxShape.circle,
              border: Border.all(
                color: done ? const Color(0xFF10B981)
                    : isActive ? Colors.amber
                    : const Color(0xFF334155),
              ),
            ),
            child: Center(child: Text(icon, style: const TextStyle(fontSize: 18))),
          ),
          const SizedBox(width: 14),
          Text(
            label,
            style: TextStyle(
              color: done ? const Color(0xFF10B981) : isActive ? Colors.amber : Colors.white38,
              fontWeight: isActive || done ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}

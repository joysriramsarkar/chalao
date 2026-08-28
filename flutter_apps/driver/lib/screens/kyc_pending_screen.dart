import 'package:flutter/material.dart';

class KycPendingScreen extends StatelessWidget {
  const KycPendingScreen({super.key});

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
                  color: Colors.amber.withOpacity(0.1),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.amber.withOpacity(0.3), width: 2),
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
                style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 15, height: 1.6),
              ),
              const SizedBox(height: 40),
              // Steps
              _step('✅', 'নিবন্ধন সম্পন্ন', true),
              _step('🔄', 'নথিপত্র যাচাই', false, isActive: true),
              _step('🚖', 'চালক সক্রিয়', false),
              const SizedBox(height: 48),
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
              color: done ? const Color(0xFF10B981).withOpacity(0.1)
                  : isActive ? Colors.amber.withOpacity(0.1)
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

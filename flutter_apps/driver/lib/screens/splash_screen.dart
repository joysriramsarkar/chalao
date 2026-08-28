import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';

// ─── Splash Screen ──────────────────────────────────────────────────────────
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000));
    _fade = Tween<double>(begin: 0, end: 1).animate(_ctrl);
    _ctrl.forward();
    _init();
  }

  Future<void> _init() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    final state = context.read<DriverAppState>();
    await state.tryAutoLogin();
    if (!mounted) return;

    if (state.isLoggedIn) {
      final kyc = state.kycStatus;
      if (kyc == 'approved') {
        Navigator.pushReplacementNamed(context, '/cockpit');
      } else if (kyc == 'pending' || kyc == 'in_review') {
        Navigator.pushReplacementNamed(context, '/kyc-pending');
      } else {
        Navigator.pushReplacementNamed(context, '/kyc');
      }
    } else {
      Navigator.pushReplacementNamed(context, '/phone');
    }
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter, end: Alignment.bottomCenter,
            colors: [Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF0F172A)],
          ),
        ),
        child: Center(
          child: FadeTransition(
            opacity: _fade,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 100, height: 100,
                  decoration: BoxDecoration(
                    color: const Color(0xFF22D3EE).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: const Color(0xFF22D3EE).withOpacity(0.4), width: 2),
                  ),
                  child: const Center(child: Text('🚖', style: TextStyle(fontSize: 48))),
                ),
                const SizedBox(height: 24),
                const Text('চালাও', style: TextStyle(fontSize: 44, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 2)),
                const SizedBox(height: 8),
                const Text('চালক ককপিট', style: TextStyle(fontSize: 16, color: Color(0xFF22D3EE))),
                const SizedBox(height: 4),
                Text('Driver Partner App', style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.5))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

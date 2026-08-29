import 'dart:async';
import 'package:flutter/material.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/api_service.dart';

class OtpVerifyScreen extends StatefulWidget {
  const OtpVerifyScreen({super.key});
  @override
  State<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends State<OtpVerifyScreen> {
  late String _phone;
  String? _devOtp;
  final _otpCtrl = TextEditingController();
  bool _loading = false;
  String? _error;
  int _resend = 60;
  Timer? _timer;
  bool _init = false;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_init) {
      final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
      _phone = args['phone'] as String;
      _devOtp = args['devOtp'] as String?;
      if (_devOtp != null && _otpCtrl.text.isEmpty) {
        _otpCtrl.text = _devOtp!;
      }
      _init = true;
    }
  }

  void _startTimer() {
    _resend = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_resend <= 0) { t.cancel(); return; }
      setState(() => _resend--);
    });
  }

  Future<void> _verify(String otp) async {
    if (otp.length < 6) return;
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiService.verifyOtp(_phone, otp);
      await ApiService.saveToken(res['token'] as String);
      final user = res['user'] as Map<String, dynamic>;
      final profile = res['driverProfile'] as Map<String, dynamic>?;
      if (!mounted) return;
      context.read<DriverAppState>().setUser(user, profile);
      final kyc = profile?['kyc_status'] as String? ?? 'pending';
      if (kyc == 'approved') {
        Navigator.pushReplacementNamed(context, '/cockpit');
      } else {
        Navigator.pushReplacementNamed(context, '/kyc');
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
      _otpCtrl.clear();
    } catch (_) {
      setState(() => _error = 'যাচাই ব্যর্থ। পুনরায় চেষ্টা করুন।');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() { _timer?.cancel(); _otpCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final pinTheme = PinTheme(
      width: 50, height: 56,
      textStyle: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF334155), width: 2),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('OTP যাচাইকরণ')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 16),
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Center(child: Text('🔐', style: TextStyle(fontSize: 32))),
              ),
              const SizedBox(height: 16),
              const Text('যাচাইকরণ কোড লিখুন', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 6),
              Text('$_phone নম্বরে পাঠানো ৬ সংখ্যার কোড লিখুন', style: TextStyle(color: Colors.white.withOpacity(0.5))),
              if (_devOtp != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF064E3B),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF10B981)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('🔑 আপনার কোড: ', style: TextStyle(color: Colors.white70)),
                      Text(
                        _devOtp!,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF34D399),
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: () {
                          _otpCtrl.text = _devOtp!;
                          _verify(_devOtp!);
                        },
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.black,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                        ),
                        child: const Text('লগইন করুন', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 28),
              Pinput(
                length: 6,
                controller: _otpCtrl,
                defaultPinTheme: pinTheme,
                focusedPinTheme: pinTheme.copyWith(
                  decoration: pinTheme.decoration!.copyWith(
                    border: Border.all(color: const Color(0xFF10B981), width: 2.5),
                  ),
                ),
                autofocus: true,
                onCompleted: _verify,
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.red[900]?.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
                ),
              ],
              const SizedBox(height: 28),
              if (_loading) const CircularProgressIndicator(color: Color(0xFF10B981))
              else ElevatedButton(
                onPressed: () => _verify(_otpCtrl.text),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.black),
                child: const Text('যাচাই ও প্রবেশ করুন', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 20),
              TextButton(
                onPressed: _resend > 0 ? null : () async {
                  final res = await ApiService.sendOtp(_phone);
                  final newOtp = res['dev_otp'] as String?;
                  setState(() {
                    _devOtp = newOtp;
                    if (newOtp != null) _otpCtrl.text = newOtp;
                  });
                  _startTimer();
                },
                child: Text(_resend > 0 ? 'পুনরায় পাঠান ($_resend সেকেন্ড)' : 'পুনরায় OTP পাঠান',
                  style: TextStyle(color: _resend > 0 ? Colors.white24 : const Color(0xFF10B981))),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

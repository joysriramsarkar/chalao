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
      setState(() => _error = 'যাচাই ব্যর্থ');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() { _timer?.cancel(); _otpCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final pinTheme = PinTheme(
      width: 56, height: 62,
      textStyle: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF334155), width: 2),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('OTP যাচাই')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 24),
              const Text('🔐', style: TextStyle(fontSize: 52)),
              const SizedBox(height: 20),
              const Text('OTP পাঠানো হয়েছে', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 8),
              Text(_phone, style: TextStyle(color: Colors.white.withOpacity(0.5))),
              if (_devOtp != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.amber.withOpacity(0.4)),
                  ),
                  child: Text('🛠️ Dev OTP: $_devOtp',
                    style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold)),
                ),
              ],
              const SizedBox(height: 40),
              Pinput(
                length: 6,
                controller: _otpCtrl,
                defaultPinTheme: pinTheme,
                focusedPinTheme: pinTheme.copyWith(
                  decoration: pinTheme.decoration!.copyWith(
                    border: Border.all(color: const Color(0xFF22D3EE), width: 2.5),
                  ),
                ),
                autofocus: true,
                onCompleted: _verify,
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ],
              const SizedBox(height: 32),
              if (_loading) const CircularProgressIndicator(color: Color(0xFF22D3EE))
              else ElevatedButton(
                onPressed: () => _verify(_otpCtrl.text),
                child: const Text('যাচাই করুন'),
              ),
              const SizedBox(height: 24),
              TextButton(
                onPressed: _resend > 0 ? null : () async {
                  await ApiService.sendOtp(_phone);
                  _startTimer();
                },
                child: Text(_resend > 0 ? 'পুনরায় পাঠান ($_resend সেকেন্ড)' : 'পুনরায় OTP পাঠান',
                  style: TextStyle(color: _resend > 0 ? Colors.white24 : const Color(0xFF22D3EE))),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

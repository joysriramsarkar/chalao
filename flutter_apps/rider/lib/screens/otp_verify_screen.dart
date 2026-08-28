import 'dart:async';
import 'package:flutter/material.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class OtpVerifyScreen extends StatefulWidget {
  const OtpVerifyScreen({super.key});

  @override
  State<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends State<OtpVerifyScreen> {
  late String _phone;
  late String _role;
  String? _devOtp;
  final _otpController = TextEditingController();
  bool _isLoading = false;
  String? _error;
  int _resendSeconds = 60;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    _phone = args['phone'] as String;
    _role = args['role'] as String? ?? 'rider';
    _devOtp = args['devOtp'] as String?;
  }

  void _startResendTimer() {
    _resendSeconds = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_resendSeconds <= 0) {
        t.cancel();
        return;
      }
      setState(() => _resendSeconds--);
    });
  }

  Future<void> _verify(String otp) async {
    if (otp.length < 6) return;
    setState(() { _isLoading = true; _error = null; });
    try {
      final result = await ApiService.verifyOtp(_phone, otp, role: _role);
      await ApiService.saveToken(result['token'] as String);
      final user = UserModel.fromJson(result['user'] as Map<String, dynamic>);
      if (!mounted) return;
      context.read<AppState>().setUser(user);
      if (!user.hasProfile) {
        Navigator.pushReplacementNamed(context, '/profile-setup');
      } else {
        Navigator.pushReplacementNamed(context, '/home');
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
      _otpController.clear();
    } catch (e) {
      setState(() => _error = 'যাচাই ব্যর্থ। পুনরায় চেষ্টা করুন।');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resend() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final result = await ApiService.sendOtp(_phone, role: _role);
      setState(() => _devOtp = result['dev_otp'] as String?);
      _startResendTimer();
    } catch (_) {
      setState(() => _error = 'পুনরায় পাঠাতে ব্যর্থ');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final defaultPinTheme = PinTheme(
      width: 54,
      height: 60,
      textStyle: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F7FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E0FF), width: 2),
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
              const Text('🔒', style: TextStyle(fontSize: 56)),
              const SizedBox(height: 20),
              Text(
                'OTP পাঠানো হয়েছে',
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                _phone,
                style: theme.textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
              ),
              // Dev mode OTP hint
              if (_devOtp != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.amber[50],
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.amber),
                  ),
                  child: Text(
                    '🛠️ Dev OTP: $_devOtp',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.orange),
                  ),
                ),
              ],
              const SizedBox(height: 40),
              Pinput(
                length: 6,
                controller: _otpController,
                defaultPinTheme: defaultPinTheme,
                focusedPinTheme: defaultPinTheme.copyWith(
                  decoration: defaultPinTheme.decoration!.copyWith(
                    border: Border.all(color: theme.colorScheme.primary, width: 2.5),
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
              if (_isLoading)
                const CircularProgressIndicator()
              else
                ElevatedButton(
                  onPressed: () => _verify(_otpController.text),
                  child: const Text('যাচাই করুন'),
                ),
              const SizedBox(height: 24),
              TextButton(
                onPressed: _resendSeconds > 0 ? null : _resend,
                child: Text(
                  _resendSeconds > 0
                      ? 'পুনরায় পাঠান ($_resendSeconds সেকেন্ড)'
                      : 'পুনরায় OTP পাঠান',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

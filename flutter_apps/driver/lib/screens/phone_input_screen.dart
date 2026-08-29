import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../widgets/server_settings_dialog.dart';

class PhoneInputScreen extends StatefulWidget {
  const PhoneInputScreen({super.key});
  @override
  State<PhoneInputScreen> createState() => _PhoneInputScreenState();
}

class _PhoneInputScreenState extends State<PhoneInputScreen> {
  final _ctrl = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _send() async {
    if (_ctrl.text.length < 10) { setState(() => _error = 'সঠিক ১০ সংখ্যার নম্বর লিখুন'); return; }
    setState(() { _loading = true; _error = null; });
    try {
      final phone = '+91${_ctrl.text.trim()}';
      final res = await ApiService.sendOtp(phone);
      if (!mounted) return;
      Navigator.pushNamed(context, '/otp', arguments: {'phone': phone, 'devOtp': res['dev_otp']});
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      final currentUrl = await ApiService.getBaseUrl();
      setState(() => _error = 'সার্ভারে সংযোগ ব্যর্থ ($currentUrl)। উপরের ⚙️ আইকন থেকে সার্ভার আইপি ঠিক আছে কিনা যাচাই করুন।');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Color(0xFF10B981)),
            tooltip: 'সার্ভার সংযোগ কনফিগারেশন',
            onPressed: () => ServerSettingsDialog.show(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              width: 64, height: 64,
              decoration: BoxDecoration(
                color: const Color(0xFF22D3EE).withOpacity(0.1),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFF22D3EE).withOpacity(0.3)),
              ),
              child: const Center(child: Text('🚖', style: TextStyle(fontSize: 32))),
            ),
            const SizedBox(height: 28),
            const Text('চালক লগইন', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 8),
            Text('আপনার নিবন্ধিত নম্বরে OTP পাঠানো হবে', style: TextStyle(color: Colors.white.withOpacity(0.5))),
            const SizedBox(height: 36),
            TextFormField(
              controller: _ctrl,
              keyboardType: TextInputType.phone,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 3),
              decoration: InputDecoration(
                labelText: 'মোবাইল নম্বর',
                prefixIcon: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Text('🇮🇳', style: TextStyle(fontSize: 18)),
                    const SizedBox(width: 6),
                    Text('+91', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 15, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 6),
                    Container(height: 20, width: 1, color: Colors.white12),
                  ]),
                ),
                errorText: _error,
                errorMaxLines: 3,
                errorStyle: const TextStyle(color: Colors.redAccent),
              ),
              onChanged: (_) => setState(() => _error = null),
              onFieldSubmitted: (_) => _send(),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _send,
              child: _loading
                  ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Color(0xFF0F172A), strokeWidth: 2.5))
                  : const Text('OTP পাঠান'),
            ),
            const SizedBox(height: 36),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('চালক সদস্যপদের সুবিধা', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                _benefit('💰', 'মাত্র ৮-১০% কমিশন'),
                _benefit('⚡', 'তাৎক্ষণিক UPI পেআউট'),
                _benefit('🗳️', 'সমবায়ে ভোটের অধিকার'),
                _benefit('📈', 'লভ্যাংশ ও প্যাট্রোনেজ'),
              ]),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _benefit(String icon, String text) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(children: [
      Text(icon, style: const TextStyle(fontSize: 16)),
      const SizedBox(width: 8),
      Text(text, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13)),
    ]),
  );
}

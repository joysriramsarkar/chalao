import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ServerSettingsDialog extends StatefulWidget {
  const ServerSettingsDialog({super.key});

  static Future<void> show(BuildContext context) async {
    await showDialog(
      context: context,
      builder: (ctx) => const ServerSettingsDialog(),
    );
  }

  @override
  State<ServerSettingsDialog> createState() => _ServerSettingsDialogState();
}

class _ServerSettingsDialogState extends State<ServerSettingsDialog> {
  final _urlController = TextEditingController();
  bool _testing = false;
  bool? _testSuccess;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _loadCurrentUrl();
  }

  Future<void> _loadCurrentUrl() async {
    final current = await ApiService.getBaseUrl();
    setState(() {
      _urlController.text = current;
    });
  }

  Future<void> _testUrl([String? customUrl]) async {
    final target = customUrl ?? _urlController.text.trim();
    if (target.isEmpty) return;

    setState(() {
      _testing = true;
      _testSuccess = null;
      _statusMessage = 'সার্ভার সংযোগ যাচাই করা হচ্ছে...';
    });

    final success = await ApiService.testConnection(target);

    if (mounted) {
      setState(() {
        _testing = false;
        _testSuccess = success;
        _statusMessage = success
            ? '✓ সংযোগ সফল! সার্ভার ও ডেটাবেস প্রস্তুত।'
            : '✕ সংযোগ ব্যর্থ। সার্ভার চালু আছে এবং মোবাইল একই ওয়াইফাই-এ আছে কিনা যাচাই করুন।';
      });
    }
  }

  Future<void> _saveUrl() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;
    await ApiService.setBaseUrl(url);
    if (!mounted) return;
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('সার্ভার আপডেট হয়েছে: $url'),
        backgroundColor: const Color(0xFF10B981),
      ),
    );
  }

  void _applyPreset(String presetUrl) {
    _urlController.text = presetUrl;
    _testUrl(presetUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF6C3DF4).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.settings_ethernet, color: Color(0xFF6C3DF4)),
          ),
          const SizedBox(width: 12),
          const Text('সার্ভার সংযোগ কনফিগ', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'মোবাইলে টেস্ট করার জন্য লোকাল পিসির ওয়াইফাই আইপি অথবা ক্লাউড ইউআরএল দিন:',
              style: TextStyle(fontSize: 13, color: Colors.black87),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _urlController,
              decoration: InputDecoration(
                labelText: 'সার্ভার API Base URL',
                hintText: 'http://192.168.31.98:3000/api',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.link, size: 20),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              style: const TextStyle(fontSize: 14, fontFamily: 'monospace'),
            ),
            const SizedBox(height: 12),
            // Presets
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ActionChip(
                  label: const Text('📡 ওয়াইফাই পিসি', style: TextStyle(fontSize: 11)),
                  backgroundColor: const Color(0xFFF3E8FF),
                  onPressed: () => _applyPreset(ApiService.defaultLocalUrl),
                ),
                ActionChip(
                  label: const Text('📱 এমুলেটর', style: TextStyle(fontSize: 11)),
                  backgroundColor: const Color(0xFFE0F2FE),
                  onPressed: () => _applyPreset(ApiService.emulatorUrl),
                ),
                ActionChip(
                  label: const Text('☁️ ক্লাউড', style: TextStyle(fontSize: 11)),
                  backgroundColor: const Color(0xFFDCFCE7),
                  onPressed: () => _applyPreset(ApiService.defaultCloudUrl),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Test Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _testing ? null : () => _testUrl(),
                icon: _testing
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.network_ping, size: 18),
                label: const Text('সংযোগ টেস্ট করুন'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF6C3DF4),
                  side: const BorderSide(color: Color(0xFF6C3DF4)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
            if (_statusMessage != null) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _testSuccess == true ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _testSuccess == true ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                  ),
                ),
                child: Text(
                  _statusMessage!,
                  style: TextStyle(
                    fontSize: 12,
                    color: _testSuccess == true ? const Color(0xFF047857) : const Color(0xFFB91C1C),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('বাতিল'),
        ),
        ElevatedButton(
          onPressed: _saveUrl,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF6C3DF4),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          child: const Text('সংরক্ষণ করুন', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}

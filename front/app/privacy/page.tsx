import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md" style={{ marginTop: '20px' }}>
        <nav className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0 h-16 flex items-center justify-between">
          <div className="flex items-center gap-0 -ml-6">
            <Link href="/" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              トップに戻る
            </Link>
          </div>
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">CoachingAI プライバシーポリシー</h1>
            
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                〇〇（以下「当社」といいます。）は、当社が提供するWebサービス「CoachingAI」（以下「本サービス」といいます。）におけるユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-8">
                当社は、ユーザーの個人情報を保護し、安心してサービスをご利用いただけるよう努めます。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第1条（適用範囲）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                本ポリシーは、ユーザーが本サービスを利用する際に当社が取得するすべての個人情報に適用されます。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                また、本サービスにリンクされた外部サービス（Google、OpenAI、Stripeなど）での個人情報の取扱いについては、各事業者のプライバシーポリシーに従うものとします。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第2条（取得する情報）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                当社は、ユーザーが本サービスを利用するにあたり、以下の情報を取得する場合があります。
              </p>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 mt-6">ユーザーが登録時に入力する情報</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>メールアドレス</li>
                <li>氏名またはニックネーム</li>
                <li>パスワード</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 mt-6">決済情報（有料プラン利用時）</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>クレジットカード情報等（Stripeなどの外部決済サービスを通じて処理）</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 mt-6">利用ログ情報</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>アクセス日時、IPアドレス、ブラウザ情報、Cookie情報、端末識別情報</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 mt-6">会話データ・入力内容</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>本サービス内のAIチャット上で入力された文章、音声、添付情報等</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 mt-6">アクセス解析情報</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-1">
                <li>Google Analytics、その他解析ツールによる利用動向データ</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第3条（利用目的）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                当社は、取得した個人情報を以下の目的で利用します。
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
                <li>本サービスの提供、運営および本人確認のため</li>
                <li>有料プランの決済処理および利用履歴管理のため</li>
                <li>問い合わせ対応、サポート提供のため</li>
                <li>本サービスの品質向上、新機能の開発および改善のため</li>
                <li>利用規約違反行為への対応および不正利用防止のため</li>
                <li>メンテナンス、重要なお知らせなどの通知のため</li>
                <li>統計的データの作成・分析（個人を特定できない形式に限る）</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第4条（外部APIの利用）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                当社は、AI対話機能の実現のために、外部API（Google Gemini、OpenAI GPTなど）を利用します。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                ユーザーが入力したテキスト、音声等は、回答生成のためにこれらの外部事業者に送信される場合があります。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                当該外部事業者のデータ取扱いは、それぞれのプライバシーポリシーに従うものとします。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第5条（Cookie等の利用）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                本サービスでは、ユーザーの利便性向上およびアクセス解析のためにCookieおよび類似技術を使用します。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                ユーザーは、ブラウザの設定によりCookieを無効化できますが、一部機能が利用できなくなる場合があります。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第6条（個人情報の第三者提供）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                当社は、次の場合を除き、ユーザーの個人情報を第三者に提供しません。
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>ユーザーの同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>人の生命・身体・財産の保護のために必要がある場合</li>
                <li>公的機関への協力が必要な場合</li>
                <li>業務委託先（サーバー運用、決済処理、AIモデル提供等）に委託する場合<br />
                　この場合、当社は委託先に対して適切な管理・監督を行います。</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第7条（個人情報の管理）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                当社は、ユーザーの個人情報を正確かつ最新の内容に保ち、不正アクセス、紛失、漏洩、改ざん等の防止に努めます。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                当社は、これらの情報を安全に管理するために、アクセス制限、暗号化、ログ監視等の措置を講じます。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第8条（情報の保存期間および削除）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                当社は、ユーザーが退会した場合、または利用目的が達成された場合、1ヶ月以内に個人情報を削除します。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                ただし、法令に基づき保存が必要な情報については、当該法令の定めに従います。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第9条（ユーザーによる開示・訂正・削除請求）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                ユーザーは、当社が保有する自己の個人情報について、開示・訂正・利用停止・削除を求めることができます。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                請求は、〇〇（メールアドレス） 宛にご連絡ください。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                当社は、本人確認のうえ、合理的な範囲で速やかに対応いたします。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第10条（プライバシーポリシーの変更）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                当社は、必要に応じて本ポリシーを改定することがあります。改定後の内容は、本サービス上に掲示した時点で効力を生じるものとします。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第11条（免責）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                当社は、外部API提供元や外部委託先のシステム障害・情報漏洩等により生じた損害について、一切の責任を負いません。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                当社は、ユーザー自身の管理不足や第三者の不正行為によって生じた損害についても、責任を負いません。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第12条（お問い合わせ窓口）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>運営者名：</strong>原圭次郎（〇〇）
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>メールアドレス：</strong>〇〇
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>サービス名：</strong>CoachingAI
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  施行日：2025年〇月〇日
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

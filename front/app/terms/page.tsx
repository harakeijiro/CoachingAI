import Link from "next/link";
import Image from "next/image";

export default function TermsPage() {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">CoachingAI 利用規約</h1>
            
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                本利用規約（以下「本規約」といいます。）は、〇〇（以下「当社」といいます。）が提供するWebサービス「CoachingAI」（以下「本サービス」といいます。）の利用条件を定めるものです。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-8">
                本サービスを利用される方（以下「ユーザー」といいます。）は、本規約の全てに同意したうえで本サービスを利用するものとします。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第1条（適用）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                本規約は、ユーザーと当社との間の本サービスに関する一切の関係に適用されます。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                当社は、本サービスに関し、本規約のほか、利用に関するルール、ガイドライン等を定める場合があります。これらは本規約の一部を構成します。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第2条（定義）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                本規約における用語の定義は、次の各号のとおりとします。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                「本サービス」：当社が提供するAI対話型Webアプリ「CoachingAI」を指します。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                「ユーザー」：本規約に同意の上、本サービスを利用する個人または法人を指します。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                「アカウント」：ユーザーが本サービスを利用するために登録する情報の集合を指します。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                「有料プラン」：当社が提供するサブスクリプション方式の有料サービスを指します。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第3条（利用登録）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                本サービスの利用を希望する者は、本規約に同意の上、当社の定める方法により登録を行うものとします。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                登録希望者が次の各号のいずれかに該当する場合、当社は登録を拒否することがあります。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-1 ml-4">
                (1) 登録内容に虚偽、誤記、または記入漏れがある場合
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-1 ml-4">
                (2) 過去に本規約に違反した者である場合
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6 ml-4">
                (3) その他、当社が不適当と判断した場合
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第4条（未成年者の利用）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                本サービスのうち恋愛関連コンテンツについては、18歳未満の方はご利用いただけません。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                ただし、メンタルケア、学習、キャリア関連の利用については学生も利用可能です。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第5条（利用料金および支払い方法）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                本サービスの一部は有料です。ユーザーは、当社が別途定める料金および支払い方法に従い、利用料金を支払うものとします。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                有料プランはサブスクリプション方式とし、契約期間は当社が定める単位（例：月単位）とします。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                ユーザーが期間途中で解約した場合でも、既に支払われた料金の返金は行いません。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第6条（禁止事項）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
                <li>法令または公序良俗に違反する行為</li>
                <li>他のユーザーまたは第三者に対する誹謗中傷、脅迫、嫌がらせ</li>
                <li>本サービスを通じて得た情報・出力内容を無断で再配布または商用利用する行為</li>
                <li>本サービスの運営を妨害する行為</li>
                <li>本サービスに関連して他のユーザーまたは第三者に不利益を与える行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第7条（AI出力内容および免責）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                本サービスでは、外部API（Gemini、GPT等）を用いたAIによる出力を提供します。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                当社は、AI出力の正確性、完全性、有用性等についていかなる保証も行いません。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                ユーザーは、AI出力の内容を参考情報として自己の判断・責任において利用するものとします。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                AI出力によって生じた損害等について、当社は一切の責任を負いません。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第8条（サービスの停止・中断）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                当社は、以下の場合にユーザーへの事前通知なしに本サービスの全部または一部を停止または中断することができます。
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6 space-y-2">
                <li>システム保守・点検・更新を行う場合</li>
                <li>火災、停電、天災地変など不可抗力により運営が困難な場合</li>
                <li>外部API提供元の障害や停止が発生した場合</li>
                <li>その他、当社が必要と判断した場合</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第9条（アカウントの停止・削除）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                当社は、ユーザーが本規約に違反した場合、または当社が不適切と判断した場合、事前の通知なしにアカウント停止または削除を行うことができます。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第10条（知的財産権）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                本サービスに関する著作権、商標権その他の知的財産権は、当社または正当な権利者に帰属します。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                ユーザーは、本サービスを通じて提供されるコンテンツを、当社の許可なく複製、転用、配布してはなりません。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第11条（個人情報の取り扱い）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                当社は、本サービスの利用により取得したユーザーの個人情報を、当社が別途定める<strong>「プライバシーポリシー」</strong>に従って適切に取り扱います。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第12条（免責事項）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                当社は、ユーザーの本サービス利用によって生じた損害について、一切の責任を負いません。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                当社は、ユーザー間または第三者との間で生じたトラブルについて関与しません。
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                当社は、予告なく本サービスの内容を変更または終了することができ、これに伴う損害について責任を負いません。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第13条（規約の変更）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                当社は、必要に応じて本規約を改定することができます。改定後の内容は、本サービス上に掲示した時点で効力を生じるものとします。
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">第14条（準拠法および裁判管轄）</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                本規約は日本法を準拠法とし、本サービスに関して生じる一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  施行日：2025年〇月〇日
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  運営者：原圭次郎（〇〇）
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

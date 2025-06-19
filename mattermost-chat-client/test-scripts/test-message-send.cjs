const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('🚀 メッセージ送信テストを開始します...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    // 最初のウィンドウ（Reactアプリ）
    const page1 = await context.newPage();
    
    try {
        // 1. Reactアプリにアクセスしてログイン
        console.log('1. Reactアプリにアクセス中...');
        await page1.goto('http://localhost:5173');
        await page1.waitForTimeout(2000);
        
        // ログインフォームの入力
        await page1.fill('input[type="text"]', 'admin');
        await page1.fill('input[type="password"]', 'Admin123456!');
        await page1.click('button[type="submit"]');
        
        console.log('✅ ログイン完了');
        await page1.waitForTimeout(3000);
        
        // 2. チャットボタンをクリック（右下の青いボタン）
        console.log('2. チャットボタンをクリック...');
        const chatButton = await page1.waitForSelector('[data-testid="chat-bubble"]', { timeout: 10000 });
        await chatButton.click();
        await page1.waitForTimeout(2000);
        
        // 3. フィルター入力欄をクリアしてから検索
        console.log('3. フィルターをクリアして全チャンネルを表示...');
        
        try {
            // フィルター入力欄を探す（複数のセレクタを試す）
            let searchInput = null;
            const selectors = [
                'input[placeholder*="佐藤"]',
                'input[value*="佐藤"]',
                'input[type="text"]',
                '[class*="MuiTextField"] input'
            ];
            
            for (const selector of selectors) {
                try {
                    searchInput = await page1.waitForSelector(selector, { timeout: 2000 });
                    if (searchInput) {
                        console.log(`フィルター入力欄が見つかりました: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // 次のセレクタを試す
                }
            }
            
            if (searchInput) {
                // フィルター入力欄をクリアする
                await searchInput.click({ clickCount: 3 }); // トリプルクリックで全選択
                await searchInput.press('Delete');
                await page1.waitForTimeout(1000);
            } else {
                console.log('フィルター入力欄が見つかりませんでした');
            }
        } catch (e) {
            console.log('フィルタークリアをスキップ:', e.message);
        }
        
        // 4. Town Squareチャンネルを選択（リストから探す）
        console.log('4. Town Squareチャンネルを選択...');
        
        // Mattermost公式チャンネルのリストを確認
        const channels = await page1.$$eval('[class*="MuiList"] [class*="MuiListItem"]', elements => 
            elements.map(el => el.textContent)
        );
        console.log('利用可能なチャンネル:', channels);
        
        // Town Squareまたは同等のチャンネルを探す
        let channelFound = false;
        const channelNames = ['Town Square', 'town-square', 'タウンスクエア', '一般'];
        
        for (const channelName of channelNames) {
            const channel = await page1.$(`text="${channelName}"`);
            if (channel) {
                console.log(`チャンネル "${channelName}" が見つかりました`);
                await channel.click();
                channelFound = true;
                break;
            }
        }
        
        if (!channelFound) {
            // 最初のパブリックチャンネルをクリック
            console.log('Town Squareが見つからないため、最初のチャンネルを選択します');
            const firstChannel = await page1.waitForSelector('[class*="MuiList"] [class*="MuiListItem"]:first-child', { timeout: 5000 });
            await firstChannel.click();
        }
        
        await page1.waitForTimeout(2000);
        
        // 5. チャットルームが開いたことを確認
        console.log('5. チャットルームの状態を確認...');
        await page1.screenshot({ 
            path: 'send-msg-1-chat-open.png',
            fullPage: true
        });
        console.log('✅ スクリーンショット保存: send-msg-1-chat-open.png');
        
        // 6. メッセージを入力
        const timestamp = new Date().toLocaleString('ja-JP');
        const testMessage = `Reactアプリから送信: テストメッセージ ${timestamp}`;
        console.log('6. メッセージを入力:', testMessage);
        
        // メッセージ入力欄を探す（複数のセレクタを試す）
        let messageInput = null;
        const inputSelectors = [
            '[data-testid="message-input"] textarea',
            'textarea[placeholder*="メッセージ"]',
            'textarea',
            'input[placeholder*="メッセージ"]',
            '[placeholder*="town-square"]'
        ];
        
        for (const selector of inputSelectors) {
            try {
                messageInput = await page1.waitForSelector(selector, { timeout: 3000 });
                if (messageInput) {
                    console.log(`メッセージ入力欄が見つかりました: ${selector}`);
                    break;
                }
            } catch (e) {
                // 次のセレクタを試す
            }
        }
        
        if (!messageInput) {
            throw new Error('メッセージ入力欄が見つかりませんでした');
        }
        
        await messageInput.fill(testMessage);
        
        // 7. 送信前の状態をスクリーンショット
        await page1.screenshot({ 
            path: 'send-msg-2-before-send.png',
            fullPage: true
        });
        console.log('✅ スクリーンショット保存: send-msg-2-before-send.png');
        
        // 8. メッセージを送信
        console.log('8. メッセージを送信...');
        await messageInput.press('Enter');
        await page1.waitForTimeout(2000);
        
        // 9. メッセージが表示されることを確認
        console.log('9. 送信後の状態を確認...');
        await page1.screenshot({ 
            path: 'send-msg-3-after-send.png',
            fullPage: true
        });
        console.log('✅ スクリーンショット保存: send-msg-3-after-send.png');
        
        // 10. 別のブラウザウィンドウでMattermostを開く
        console.log('10. Mattermostを別ウィンドウで開く...');
        const page2 = await context.newPage();
        await page2.goto('http://localhost:8065');
        await page2.waitForTimeout(2000);
        
        // 11. Mattermostにログイン
        console.log('11. Mattermostにログイン...');
        try {
            // ログインフォームがある場合
            const loginButton = await page2.waitForSelector('button:has-text("Sign in")', { timeout: 5000 });
            if (loginButton) {
                await page2.fill('input[id="input_loginId"]', 'admin');
                await page2.fill('input[id="input_password-input"]', 'Admin123456!');
                await loginButton.click();
                await page2.waitForTimeout(3000);
            }
        } catch (e) {
            console.log('既にログイン済みの可能性があります');
        }
        
        // Town Squareチャンネルに移動
        try {
            const channelLink = await page2.waitForSelector('a[href*="town-square"]', { timeout: 5000 });
            await channelLink.click();
        } catch (e) {
            console.log('既にTown Squareにいる可能性があります');
        }
        
        await page2.waitForTimeout(2000);
        
        // 12. Reactアプリからのメッセージを確認
        console.log('12. Mattermostでメッセージを確認...');
        await page2.screenshot({ 
            path: 'send-msg-4-mattermost-view.png',
            fullPage: true
        });
        console.log('✅ スクリーンショット保存: send-msg-4-mattermost-view.png');
        
        // 13. Mattermostから返信
        console.log('13. Mattermostから返信メッセージを送信...');
        const replyMessage = 'Mattermostから返信: 受信確認しました';
        
        const mattermostInput = await page2.waitForSelector('#post_textbox', { timeout: 10000 });
        await mattermostInput.fill(replyMessage);
        await mattermostInput.press('Enter');
        await page2.waitForTimeout(2000);
        
        // 14. Reactアプリに戻って返信を確認
        console.log('14. Reactアプリで返信メッセージを確認...');
        await page1.bringToFront();
        await page1.waitForTimeout(3000); // WebSocketでメッセージが届くのを待つ
        
        await page1.screenshot({ 
            path: 'send-msg-5-reply-received.png',
            fullPage: true
        });
        console.log('✅ スクリーンショット保存: send-msg-5-reply-received.png');
        
        // テスト結果の確認
        console.log('\n📊 テスト結果:');
        
        // メッセージが送信されたか確認
        const sentMessage = await page1.textContent(`text="${testMessage}"`);
        if (sentMessage) {
            console.log('✅ メッセージが正常に送信されました');
        } else {
            console.log('❌ メッセージの送信に失敗しました');
        }
        
        // 入力欄がクリアされたか確認
        const inputValue = await messageInput.inputValue();
        if (inputValue === '') {
            console.log('✅ 送信後に入力欄がクリアされました');
        } else {
            console.log('❌ 入力欄がクリアされていません:', inputValue);
        }
        
        // Mattermost側での表示を確認
        const mattermostMessage = await page2.textContent(`text="${testMessage}"`);
        if (mattermostMessage) {
            console.log('✅ Mattermost側で正しく表示されています');
        } else {
            console.log('❌ Mattermost側でメッセージが見つかりません');
        }
        
        // 返信メッセージの確認
        const replyReceived = await page1.textContent(`text="${replyMessage}"`);
        if (replyReceived) {
            console.log('✅ 双方向通信が成立しています（返信メッセージを受信）');
        } else {
            console.log('❌ 返信メッセージが受信されていません');
        }
        
        console.log('\n✅ メッセージ送信テストが完了しました');
        
    } catch (error) {
        console.error('❌ テスト中にエラーが発生しました:', error);
        await page1.screenshot({ 
            path: 'send-msg-error.png',
            fullPage: true
        });
    }
    
    await browser.close();
})();
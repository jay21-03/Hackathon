package com.seal.hackathon.registration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.seal.hackathon.common.exception.BusinessException;
import com.seal.hackathon.registration.service.InvitationTokenCodec;
import org.junit.jupiter.api.Test;

class InvitationTokenCodecTest {

    @Test
    void parse_plainFourSegmentToken() {
        String raw = "12.34.abc123nonce.dGVzdF9yYXdfdG9rZW4";
        InvitationTokenCodec.InvitationTokenParts parts = InvitationTokenCodec.parse(raw);
        assertThat(parts.teamId()).isEqualTo(12L);
        assertThat(parts.teamMemberId()).isEqualTo(34L);
        assertThat(parts.nonce()).isEqualTo("abc123nonce");
        assertThat(parts.rawToken()).isEqualTo("dGVzdF9yYXdfdG9rZW4");
    }

    @Test
    void parse_base64WrappedTokenFromEmailLink() {
        String plain = "5.9.noncevalue.AbCdEfGh";
        String wrapped = InvitationTokenCodec.encodeForEmailLink(plain);
        InvitationTokenCodec.InvitationTokenParts parts = InvitationTokenCodec.parse(wrapped);
        assertThat(parts.teamId()).isEqualTo(5L);
        assertThat(parts.teamMemberId()).isEqualTo(9L);
        assertThat(parts.nonce()).isEqualTo("noncevalue");
        assertThat(parts.rawToken()).isEqualTo("AbCdEfGh");
    }

    @Test
    void parse_rejectsThreeSegments() {
        assertThatThrownBy(() -> InvitationTokenCodec.parse("1.2.3"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Invalid invitation token");
    }
}
